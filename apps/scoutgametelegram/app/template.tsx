'use client';

import { usePageView } from '@packages/scoutgame-ui/hooks/usePageView';

export default function Template({ children }: { children: React.ReactNode }) {
  usePageView();

  return children;
}
