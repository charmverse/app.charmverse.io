import type { Space } from '@prisma/client';
import { useRouter } from 'next/router';

import { useSpaces } from 'hooks/useSpaces';

export function useSpaceIdFromPath() {
  const router = useRouter();
  return router.query.spaceId as string | undefined;
}

export function useSpaceFromPath(): Space | null {
  const baseSpaceId = useSpaceIdFromPath();
  const { spaces } = useSpaces();
  const baseSpace = Object.values(spaces).find((space) => space?.id === baseSpaceId || space?.domain === baseSpaceId);
  return baseSpace || null;
}
