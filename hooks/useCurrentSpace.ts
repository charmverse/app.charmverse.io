import { useRouter } from 'next/router';

import { useSharedPage } from 'hooks/useSharedPage';

import { useSpaces } from './useSpaces';

export function useCurrentSpace() {
  const router = useRouter();
  const { spaces } = useSpaces();
  const { publicSpace, accessCheked } = useSharedPage();

  // Support for extracting domain from logged in view or shared bounties view
  // The other part of this logic, which retrieves list of spaces in public mode is in components/share/PublicPage
  const domain = router.query.domain ?? router.query.pageId?.[0];

  const space = spaces.find((w) => w.domain === domain);

  if (accessCheked) {
    // IF we are viewing a public page, we want to return the public space as current one
    return publicSpace || space;
  }
}
