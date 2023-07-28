const esmModules = [
  '@bangle.dev/react',
  '@bangle.dev/tooltip',
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
  'lit-share-modal-v3',
  'uuid',
  'data-uri-to-buffer',
  'fetch-blob',
  // '@babel/runtime',
  'formdata-polyfill',
  'jose',
  'nanoid',
  '@charmverse/core'
];

// this breaks the dev environment with an error when importing MUI icons: Cannot use 'import.meta' outside a module
if (process.env.NODE_ENV === 'test') {
  esmModules.push('@babel/runtime');
}

exports.esmModules = esmModules;
