const esmModules = [
  '@bangle.dev/base-components',
  '@bangle.dev/utils',
  'prosemirror-utils-bangle',
  '@popperjs/core',
  '@fullcalendar/common',
  '@fullcalendar/core',
  '@fullcalendar/daygrid',
  '@fullcalendar/interaction',
  '@fullcalendar/react',
  'dnd-core',
  'react-dnd',
  '@react-dnd/invariant',
  '@react-dnd/asap',
  '@react-dnd/shallowequal',
  'react-pdf',
  'react-dnd-html5-backend',
  'react-dnd-multi-backend',
  'react-dnd-touch-backend',
  'dnd-multi-backend',
  'dnd-core',
  '@react-dnd/invariant',
  '@react-dnd/asap',
  '@react-dnd/shallowequal',
  'react-dnd-preview',
  'redux',
  '@hookform/resolvers',
  'uuid',
  'nanoid',
  'data-uri-to-buffer',
  'fetch-blob',
  'lodash-es',
  // '@babel/runtime',
  'formdata-polyfill',
  'jose',
  'nanoid',
  '@charmverse/core',
  '@lens-protocol',
  'wagmi' // compile wagmi to avoid error: QueryClientProvider must be used as a child of ReactQueryClientProvider when running app
];

// this breaks the dev environment with an error when importing MUI icons: Cannot use 'import.meta' outside a module
if (process.env.NODE_ENV === 'test') {
  esmModules.push('@babel/runtime');
  esmModules.push('isows');
  // related modules
  esmModules.push(
    ...[
      'wagmi',
      '@wagmi/core',
      '@wagmi/connectors',
      '@walletconnect/core',
      '@walletconnect/utils',
      '@walletconnect/ethereum-provider',
      '@walletconnect/relay-auth',
      'preact',
      'uint8arrays',
      'multiformats'
    ]
  );
}

exports.esmModules = esmModules;
