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
    // IF we are viewing a public page, we want to return the public space as current one
    return publicSpace || space;
  }
}
