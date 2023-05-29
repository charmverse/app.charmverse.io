import { useRouter } from 'next/router';

import { useSharedPage } from 'hooks/useSharedPage';
import { filterSpaceByDomain } from 'lib/spaces/filterSpaceByDomain';

import { useSpaces } from './useSpaces';

export function useCurrentSpace() {
  const router = useRouter();
  const { spaces } = useSpaces();
  const { publicSpace, accessChecked } = useSharedPage();

  // Support for extracting domain from logged in view or shared bounties view
  // domain in query can be either space domain or custom domain
  const domainOrCustomDomain = router.query.domain;

  const space = filterSpaceByDomain(spaces, domainOrCustomDomain as string);

  if (accessChecked) {
    // We always want to return the space as priority since it's not just set by the URL
    return space ?? publicSpace;
  }
}
