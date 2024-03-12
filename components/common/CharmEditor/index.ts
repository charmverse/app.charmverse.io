import dynamic from 'next/dynamic';

export const CharmEditor = dynamic(() => import('./CharmEditor'), {
  ssr: false
});

export const InlineCharmEditor = dynamic(() => import('./InlineCharmEditor'), {
  ssr: false
});
