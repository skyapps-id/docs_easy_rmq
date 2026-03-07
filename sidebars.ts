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
      items: [
        'installation/index',
        'installation/rust',
        'installation/go',
      ],
    },
    {
      type: 'category',
      label: 'Basic Features',
      items: [
        'basic/index',
        {
          type: 'category',
          label: 'Rust',
          items: [
            'basic/rust/publisher',
            'basic/rust/subscriber',
            'basic/rust/dependency-injection',
          ],
        },
        {
          type: 'category',
          label: 'Go',
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
      items: [
        'advanced/index',
        {
          type: 'category',
          label: 'Rust',
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
    'examples',
  ],

  // Rust documentation sidebar
  rustSidebar: [
    {
      type: 'doc',
      id: 'rust/intro',
      label: 'Easy RMQ for Rust',
    },
    {
      type: 'category',
      label: 'Basic Features',
      items: [
        'basic/rust/publisher',
        'basic/rust/subscriber',
        'basic/rust/dependency-injection',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Features',
      items: [
        'advanced/rust/retry-mechanism',
        'advanced/rust/prefetch-control',
        'advanced/rust/parallel-processing',
        'advanced/rust/single-active-consumer',
        'advanced/rust/middleware',
        'advanced/rust/distributed-tracing',
      ],
    },
  ],

  // Go documentation sidebar
  goSidebar: [
    {
      type: 'doc',
      id: 'go/intro',
      label: 'Easy RMQ for Go',
    },
    {
      type: 'category',
      label: 'Basic Features',
      items: [
        'basic/go/publisher',
        'basic/go/subscriber',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Features',
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
};

export default sidebars;
