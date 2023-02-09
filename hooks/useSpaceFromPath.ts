import type { Space } from '@prisma/client';
import { useRouter } from 'next/router';

import { useSpaces } from 'hooks/useSpaces';

export function useSpaceFromPath(): Space | null {
  const router = useRouter();
  const baseSpaceId = router.query.domain as string | undefined;
  const { spaces } = useSpaces();
  const baseSpace = Object.values(spaces).find((space) => space?.id === baseSpaceId || space?.domain === baseSpaceId);
  return baseSpace || null;
}
