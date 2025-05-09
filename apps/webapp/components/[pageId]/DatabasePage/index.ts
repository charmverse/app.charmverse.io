import dynamic from 'next/dynamic';

export const DatabasePage = dynamic(() => import('./DatabasePage').then((module) => module.DatabasePage), {
  ssr: false
});
