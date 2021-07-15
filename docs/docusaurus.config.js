const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: "Hasura Backend Plus",
  tagline: "Authentication and Storage for Hasura",
  url: "https://nhost.github.io",
  baseUrl: "/hasura-backend-plus/",
  trailingSlash: false,
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "nhost", // Usually your GitHub org/user name.
  projectName: "hasura-backend-plus", // Usually your repo name.
  themeConfig: {
    colorMode: {
      defaultMode: "light",
    },
    announcementBar: {
      id: "announcementBar-1", // Increment on change
      content: `
      <a href="https://nhost.io">Deploy Hasura Backend Plus (+ Postgres and Hasura) in seconds with Nhost!</a>
        `,
      backgroundColor: "#fafbfc",
      textColor: "#091E42",
      isCloseable: false,
    },
    navbar: {
      title: "Hasura Backend Plus",
      logo: {
        alt: "Hasura Backend Plus Documentation",
        src: "img/logo.png",
      },
      items: [
        {
          type: "doc",
          docId: "intro",
          position: "left",
          label: "Documentation",
        },
        {
          type: "doc",
          docId: "api-reference",
          position: "left",
          label: "API Reference",
        },
        {
          href: "https://github.com/nhost/hasura-backend-plus",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Tutorial",
              to: "/docs/intro",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Discord",
              href: "https://discord.com/invite/9V7Qb2U",
            },
            {
              label: "Twitter",
              href: "https://twitter.com/nhostio",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Nhost",
              to: "https://nhost.io",
            },
            {
              label: "GitHub",
              href: "https://github.com/nhost/hasura-backend-plus",
            },
          ],
        },
      ],
      copyright: `Open Source ${new Date().getFullYear()} Nhost AB, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl:
            "https://github.com/nhost/hasura-backend-plus/edit/master/docs/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
