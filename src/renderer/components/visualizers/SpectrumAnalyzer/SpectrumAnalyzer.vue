<script setup lang="ts">
import { useState } from "@/amethyst";
import { interpolateArray, scaleLog } from "@/logic/math";
import * as THREE from "three";
import { Ref, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps<{ node: AudioNode }>();
let shouldStopRendering = false;

const getDimensions = () => {
  if (!threeCanvas.value) return;
  const containerWidth = threeCanvas.value.parentElement!.getBoundingClientRect().width;
  const containerHeight = threeCanvas.value.parentElement!.getBoundingClientRect().height;

  const width = containerWidth * 4;
  const height = containerHeight * 4;
  return { width, height };
};

const threeCanvas = ref() as Ref<HTMLCanvasElement>;
onMounted(async () => {
  const { width, height } = getDimensions() || {};
  if (!width || !height) return;

  const cube = (width: number = 1.0, offset: number = 1.0): THREE.Vector2[] => {
    const vertices: THREE.Vector2[] = [];

    // 1
    // |\ 
    // | \
    // |  \
    // |___\
    // 0    2

    vertices.push(new THREE.Vector2(0.0 * width + offset, 0.0)); // 0
    vertices.push(new THREE.Vector2(0.0 * width + offset, height * 4)); // 1
    vertices.push(new THREE.Vector2(1.0 * width + offset, 0.0)); // 2

    // 0_____1
    //  \   |
    //   \  |
    //    \ |
    //     \|
    //      2

    vertices.push(new THREE.Vector2(0.0 * width + offset, height * 4)); // 0
    vertices.push(new THREE.Vector2(1.0 * width + offset, height * 4)); // 1
    vertices.push(new THREE.Vector2(1.0 * width + offset, 0.0)); // 2

    return vertices;
  };

  const TOTAL_BARS = 256;

  const loader = new THREE.FileLoader();
  const camera = new THREE.OrthographicCamera(0, width, -height * 1.25, 0, 0, 10000);
  camera.position.set(0, 0, 1);
  const scene = new THREE.Scene();
  // init

  // const geometry = new THREE.PlaneGeometry(1.0, 1.0);
  const geometry = new THREE.BufferGeometry().setFromPoints([]);
  const vertices: THREE.Vector2[] = [];
  const indexes = [];
  const uniformData = {
    u_amplitude: {
      type: "iv1",
      value: [] as number[]
    },
    u_height: {
      type: "i",
      value: height
    }
  };

  for (let i = 0; i < TOTAL_BARS; i++) {
    vertices.push(...cube(width / TOTAL_BARS, i * (width / TOTAL_BARS)));
    for (let j = 0; j < 12; j++) {
      indexes.push(i);
    }

    // Add to amplitude array a default number
    uniformData.u_amplitude.value.push(1.0);
  }

  geometry.setFromPoints(vertices);
  geometry.setAttribute("idx", new THREE.BufferAttribute(new Uint16Array(indexes), 2));

  const material = new THREE.ShaderMaterial({
    wireframe: false,
    transparent: true,
    uniforms: uniformData,
    // @ts-ignore
    fragmentShader: await loader.loadAsync(new URL("./SpectrumFrag.glsl", import.meta.url).toString()) as string,
    // @ts-ignore
    vertexShader: await loader.loadAsync(new URL("./SpectrumVertex.glsl", import.meta.url).toString()) as string,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas.value, antialias: true });
  renderer.setAnimationLoop(draw);
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0); // the default

  const resizeObserver = new ResizeObserver(() => {
    const d = getDimensions();
    if (d) renderer.setSize(d.width, d.height);

  });

  resizeObserver.observe(threeCanvas.value.parentElement!);

  // animation
  const context = props.node.context;
  const analyser = context.createAnalyser();
  const gain = context.createGain();

  props.node.connect(gain);
  gain.gain.value = 32;
  gain.connect(analyser);

  analyser.fftSize = useState().settings.value.spectrumFftSize;
  analyser.smoothingTimeConstant = useState().settings.value.spectrumSmoothing;
  watch(() => useState().settings.value.spectrumFftSize, () => analyser.fftSize = useState().settings.value.spectrumFftSize);
  watch(() => useState().settings.value.spectrumSmoothing, () => analyser.smoothingTimeConstant = useState().settings.value.spectrumSmoothing);

  // Don't change these
  analyser.maxDecibels = 12;
  analyser.minDecibels = -64;

  watch(() => useState().state.isFocused, isFocused => {
    if (useState().settings.value.pauseVisualsWhenUnfocused) {
      if (!isFocused) shouldStopRendering = true;
      else {
        shouldStopRendering = false;
        renderer.setAnimationLoop(draw); // 
      }
    }
  });

  function draw() {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const points = useState().settings.value.useLogarithmicSpectrum ? scaleLog(dataArray) : dataArray;
    interpolateArray(Array.from(points), TOTAL_BARS).forEach((point, i) => {
      uniformData.u_amplitude.value[i] = point;
    });

    if (shouldStopRendering) {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      renderer.setAnimationLoop(null);
      return;
    }
    renderer.render(scene, camera);
  }
});

onUnmounted(() => shouldStopRendering = true);

</script>

<template>
  <div class="relative overflow-hidden w-full h-full  rounded-4px">
    <canvas
      ref="threeCanvas"
      class="transform-gpu scale-25 origin-top-left absolute top-0 left-0"
    />
  </div>
</template>
