import { useCurrentSpaceId } from 'hooks/useCurrentSpaceId';
import { useSharedPage } from 'hooks/useSharedPage';

import { useSpaces } from './useSpaces';

export function useCurrentSpace() {
  // const router = useRouter();
  const { spaces } = useSpaces();
  const { publicSpace, accessChecked } = useSharedPage();
  const { currentSpaceId } = useCurrentSpaceId();

  const space = spaces.find((w) => w.id === currentSpaceId);

  if (accessChecked) {
    // We always want to return the space as priority since it's not just set by the URL
    return space ?? publicSpace;
  }
}
