import { useMemo } from 'react';

import { useUser } from './useUser';

export function useUserId() {
  const { user } = useUser();

  return useMemo(() => user?.id, [user?.id]);
}
