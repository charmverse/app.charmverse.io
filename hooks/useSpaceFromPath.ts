import type { Space } from '@prisma/client';
import { useRouter } from 'next/router';

import { useSpaces } from 'hooks/useSpaces';

export function useSpaceFromPath(): Space | null {
  const router = useRouter();
  const { spaces } = useSpaces();
  const spaceDomain = router.query.domain as string | undefined;
  const spaceFromPath = Object.values(spaces).find((space) => space.domain === spaceDomain);
  return spaceFromPath || null;
}
