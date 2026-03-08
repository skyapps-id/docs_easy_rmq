import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Easy RMQ',
  tagline: 'Modern AMQP libraries for Rust and Go with connection pool, publisher, subscriber, and dependency injection support',
  favicon: 'img/favicon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'easyrmq', // Usually your GitHub org/user name.
  projectName: 'easy-rmq', // Usually your repo name.

  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/skyapps-id/my-docs/tree/main/docs',
          // Versioning configuration
          includeCurrentVersion: true,
          lastVersion: '1.0.0',
          versions: {
            current: {
              label: '1.0.1 🏗️',
              banner: 'unreleased',
            },
            '1.0.0': {
              label: '1.0.0',
            },
            '1.0.0-beta': {
              label: '1.0.0-beta',
              banner: 'unmaintained',
              className: 'docs-version-beta',
            },
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Easy RMQ',
      logo: {
        alt: 'Easy RMQ Logo',
        src: 'img/logo-icon.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'dropdown',
          label: 'Languages',
          position: 'left',
          items: [
            {
              label: 'Rust →',
              href: 'https://github.com/skyapps-id/easy-rmq-rs',
            },
            {
              label: 'Go →',
              href: 'https://github.com/skyapps-id/easy-rmq-go',
            },
          ],
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownItemsBefore: [],
          dropdownItemsAfter: [],
        },
        {
          href: 'https://github.com/skyapps-id/easy_rmq',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Documentation',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Rust Issues',
              href: 'https://github.com/skyapps-id/easy-rmq-rs/issues',
            },
            {
              label: 'Go Issues',
              href: 'https://github.com/skyapps-id/easy-rmq-go/issues',
            },
            {
              label: 'Documentation Issues',
              href: 'https://github.com/skyapps-id/my-docs/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Rust GitHub',
              href: 'https://github.com/skyapps-id/easy-rmq-rs',
            },
            {
              label: 'Go GitHub',
              href: 'https://github.com/skyapps-id/easy-rmq-go',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Skyapps ID.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
