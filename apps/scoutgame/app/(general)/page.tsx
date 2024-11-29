import dynamic from 'next/dynamic';

const LandingPage = dynamic(() => import('components/home/LandingPage').then((mod) => mod.LandingPage), { ssr: false });

export default async function Home() {
  return <LandingPage />;
}
