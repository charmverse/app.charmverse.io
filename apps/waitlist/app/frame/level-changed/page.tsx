'use client';

import { useSearchParams } from 'next/navigation';

import { LevelChangedHome } from 'components/frame/LevelChangedHome';
import type { TierChange } from 'lib/scoring/constants';

export const dynamic = 'force-dynamic';

export default function LevelChangedPage() {
  const search = useSearchParams();
  return (
    <LevelChangedHome
      fid={search.get('fid') as string}
      percentile={parseInt(search.get('percentile') as string)}
      tierChange={search.get('tierChange') as TierChange}
    />
  );
}
