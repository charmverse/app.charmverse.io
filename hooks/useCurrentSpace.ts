import { useRouter } from 'next/router';

import { useSharedPage } from 'hooks/useSharedPage';

import { useSpaces } from './useSpaces';

export function useCurrentSpace() {
  const router = useRouter();
  const { spaces } = useSpaces();
  const { publicSpace, accessChecked } = useSharedPage();

  // Support for extracting domain from logged in view or shared bounties view
  const domain = router.query.domain;

  const space = spaces.find((w) => w.domain === domain);

  if (accessChecked) {
    // We always want to return the space as priority since it's not just set by the URL
    return space ?? publicSpace;
  }
}
