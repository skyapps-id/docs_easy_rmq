import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
  - render a sidebar for each doc of that group
  - provide next/previous navigation

  The sidebars can be generated from the filesystem, or explicitly defined here.

  Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Installation',
      collapsed: false,
      items: [
        'installation/rust',
        'installation/go',
      ],
    },
    {
      type: 'category',
      label: 'Basic Features',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Rust',
          collapsed: false,
          items: [
            'basic/rust/publisher',
            'basic/rust/subscriber',
            'basic/rust/dependency-injection',
          ],
        },
        {
          type: 'category',
          label: 'Go',
          collapsed: false,
          items: [
            'basic/go/publisher',
            'basic/go/subscriber',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Advanced Features',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Rust',
          collapsed: false,
          items: [
            'advanced/rust/retry-mechanism',
            'advanced/rust/prefetch-control',
            'advanced/rust/parallel-processing',
            'advanced/rust/single-active-consumer',
            'advanced/rust/middleware',
            'advanced/rust/distributed-tracing',
          ],
        },
        {
          type: 'category',
          label: 'Go',
          collapsed: false,
          items: [
            'advanced/go/retry-mechanism',
            'advanced/go/prefetch-control',
            'advanced/go/parallel-processing',
            'advanced/go/single-active-consumer',
            'advanced/go/middleware',
            'advanced/go/distributed-tracing',
          ],
        },
      ],
    },
  ],

};

export default sidebars;
