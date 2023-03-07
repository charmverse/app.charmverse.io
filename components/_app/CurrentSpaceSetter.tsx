import { useEffect } from 'react';

import { useSpaceGatesReevaluate } from 'components/_app/hooks/useSpaceGatesReevaluate';
import { useCurrentSpaceId } from 'hooks/useCurrentSpaceId';
import { useSpaceFromPath } from 'hooks/useSpaceFromPath';

export function CurrentSpaceSetter() {
  const spaceFromPath = useSpaceFromPath();
  const { setCurrentSpaceId } = useCurrentSpaceId();
  useSpaceGatesReevaluate();

  useEffect(() => {
    setCurrentSpaceId(spaceFromPath?.id ?? '');
  }, [spaceFromPath?.id]);

  return null;
}
