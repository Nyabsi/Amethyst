import {defineConfig} from "vitepress";

export default defineConfig({ 
  title: "Amethyst",
  description: "Amethyst Documentation",
  lang: 'en-US',
  
  head: [
    ["link", {rel: "icon", href: "https://github.com/Geoxor/amethyst/raw/master/assets/icon.svg"}]
  ],
  appearance: "dark",
  themeConfig: {
    footer: {
      message: "Made with the loss of multiple braincells 🧠"
    },
    socialLinks: [
      {
        link: "https://discord.gg/geoxor",
        icon: "discord"
      },
      {
        link: "https://github.com/Geoxor/amethyst",
        icon: "github"
      },
    ],
    editLink: {
      pattern: 'https://github.com/Geoxor/amethyst/tree/master/docs/:path'
    },
    siteTitle: "Amethyst",
    logo: "https://raw.githubusercontent.com/Geoxor/amethyst/master/assets/icon.svg",
    nav: [
      { text: "Documentation", link: "/introduction" },
      { text: "Download", link: "/installation/package_managers"},
    ],
    sidebar: [
      {
        text: 'Installation',
        items: [
          { text: 'Package Managers', link: '/installation/package_managers' },
          { text: 'Build from Source', link: '/installation/build_from_source' },
        ]
      },
      {
        text: 'File Types',
        items: [
          { text: 'Amethyst Node Graph (.ang)', link: '/file_types/ang' },
          { text: 'Amethyst Metadata File (.amf)', link: '/file_types/amf' },
        ]
      },
      {
        text: 'Audio Nodes',
        collapsible: true,
        items: [
          { text: "Input Node", link: "/nodes/input_node"},
          { text: "Master Node", link: "/nodes/master_node"},
          { text: "Output Node", link: "/nodes/output_node"},
          { text: "Filter Node", link: "/nodes/filter_node"},
        ]
      }
    ]
  }
})