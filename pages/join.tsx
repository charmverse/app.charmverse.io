import NavigateNextIcon from '@mui/icons-material/ArrowRightAlt';
import { Alert, Box, Card, Divider } from '@mui/material';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { getLayout as getBaseLayout } from 'components/common/BaseLayout/getLayout';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle } from 'components/common/Modal';
import { SpaceAccessGate } from 'components/common/SpaceAccessGate/SpaceAccessGate';
import { SpaceAccessGateWithSearch } from 'components/common/SpaceAccessGate/SpaceAccessGateWithSearch';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useSpaces } from 'hooks/useSpaces';
import { filterSpaceByDomain } from 'lib/spaces/filterSpaceByDomain';
import { getAppUrl, getSpaceUrl } from 'lib/utilities/browser';

export function AlternateRouteButton({ href, children }: { href: string; children: ReactNode }) {
  const { spaces } = useSpaces();
  const showMySpacesLink = spaces.length > 0;
  return (
    <Box display='flex' alignItems='center' justifyContent={showMySpacesLink ? 'space-between' : 'center'}>
      {showMySpacesLink && (
        <Button variant='text' href={getSpaceUrl({ domain: spaces[0]?.domain })} endIcon={<NavigateNextIcon />}>
          Go to my space
        </Button>
      )}
      <Button variant='text' href={href} endIcon={<NavigateNextIcon />}>
        {children}
      </Button>
    </Box>
  );
}

export default function JoinWorkspace() {
  const { navigateToSpacePath, router } = useCharmRouter();
  const domain = router.query.domain as string;
  const { spaces } = useSpaces();
  const [isRouterReady, setRouterReady] = useState(false);
  const {
    data: spaceFromPath,
    isLoading: isSpaceLoading,
    error: spaceError
  } = useSWRImmutable(domain ? `space/${domain}` : null, () =>
    charmClient.spaces.searchByDomain(stripUrlParts(domain || ''))
  );

  useEffect(() => {
    const connectedSpace = filterSpaceByDomain(spaces, domain);
    if (connectedSpace) {
      navigateToSpacePath(`/`);
    }
  }, [spaces]);

  useEffect(() => {
    // isReady should only be used conditionally inside a useEffect()
    if (router.isReady) {
      setRouterReady(true);
    }
  }, [router.isReady]);

  const spaceFromPathNotFound = domain && !isSpaceLoading && !spaceFromPath;

  return (
    <Box sx={{ width: 600, maxWidth: '100%', mx: 'auto', mb: 6, px: 2 }}>
      <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
        <DialogTitle>Join space</DialogTitle>
        <Divider />
        {domain && isSpaceLoading && <LoadingComponent height='80px' isLoading={true} />}
        {domain && !isSpaceLoading && spaceError && <Alert severity='error'>No space found</Alert>}
        {domain && spaceFromPath && <SpaceAccessGate space={spaceFromPath} />}
        {isRouterReady && (spaceFromPathNotFound || !domain) && <SpaceAccessGateWithSearch defaultValue={domain} />}
      </Card>
      <AlternateRouteButton href={`${getAppUrl()}createSpace`}>Create a space</AlternateRouteButton>
    </Box>
  );
}

function stripUrlParts(maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}

JoinWorkspace.getLayout = getBaseLayout;
