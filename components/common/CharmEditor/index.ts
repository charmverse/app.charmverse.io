import dynamic from 'next/dynamic';

export const CharmEditor = dynamic(() => import('./CharmEditor'), {
  ssr: false
});
