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
    // IF we are viewing a public page, we want to return the public space as current one
    return publicSpace || space;
  }
}
