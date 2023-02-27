import NavigateNextIcon from '@mui/icons-material/ArrowRightAlt';
import { Alert, Box, Card, Divider } from '@mui/material';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle } from 'components/common/Modal';
import { SpaceAccessGate } from 'components/common/SpaceAccessGate/SpaceAccessGate';
import { SpaceAccessGateWithSearch } from 'components/common/SpaceAccessGate/SpaceAccessGateWithSearch';
import { useSpaces } from 'hooks/useSpaces';

export function AlternateRouteButton({ href, children }: { href: string; children: ReactNode }) {
  const { spaces } = useSpaces();
  const showMySpacesLink = spaces.length > 0;
  return (
    <Box display='flex' alignItems='center' justifyContent={showMySpacesLink ? 'space-between' : 'center'}>
      {showMySpacesLink && (
        <Button variant='text' href={`/${spaces[0]?.domain}`} endIcon={<NavigateNextIcon />}>
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
  const router = useRouter();
  const domain = router.query.domain as string;
  const { spaces } = useSpaces();
  const {
    data: space,
    isLoading: isSpaceLoading,
    error: spaceError
  } = useSWR(domain ? `space/${domain}` : null, () => charmClient.spaces.searchByDomain(stripUrlParts(domain || '')));

  useEffect(() => {
    const connectedSpace = spaces.find((_space) => _space.domain === router.query.domain);
    if (connectedSpace) {
      router.push(`/${connectedSpace.domain}`);
    }
  }, [spaces]);

  return (
    <Box sx={{ width: 600, maxWidth: '100%', mx: 'auto', mb: 6, px: 2 }}>
      <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
        <DialogTitle>Join a space</DialogTitle>
        <Divider />
        {domain && isSpaceLoading && <LoadingComponent height='80px' isLoading={true} />}
        {domain && !isSpaceLoading && spaceError && <Alert severity='error'>No space found</Alert>}
        {domain && space && <SpaceAccessGate space={space} />}
        {!domain && <SpaceAccessGateWithSearch />}
      </Card>
      <AlternateRouteButton href='/createWorkspace'>Create a space</AlternateRouteButton>
    </Box>
  );
}

function stripUrlParts(maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}

JoinWorkspace.getLayout = getBaseLayout;
