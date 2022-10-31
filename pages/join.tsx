import NavigateNextIcon from '@mui/icons-material/ArrowRightAlt';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import Button from 'components/common/Button';
import { DialogTitle } from 'components/common/Modal';
import { JoinDynamicSpaceForm } from 'components/common/TokenGateForm/JoinDynamicSpaceForm';
import { JoinPredefinedSpaceDomain } from 'components/common/TokenGateForm/JoinPredefinedSpaceDomain';
import { useOnboarding } from 'hooks/useOnboarding';
import { useSpaces } from 'hooks/useSpaces';

export function AlternateRouteButton ({ href, children }: { href: string, children: ReactNode }) {
  const { spaces } = useSpaces();
  const showMySpacesLink = spaces.length > 0;
  return (
    <Box display='flex' alignItems='center' justifyContent={showMySpacesLink ? 'space-between' : 'center'}>
      {showMySpacesLink && (
        <Button variant='text' href={`/${spaces[0]?.domain}`} endIcon={<NavigateNextIcon />}>
          Go to my workspace
        </Button>
      )}
      <Button variant='text' href={href} endIcon={<NavigateNextIcon />}>
        {children}
      </Button>
    </Box>
  );
}

export default function JoinWorkspace () {
  const router = useRouter();
  const domain = router.query.domain;
  const { spaces } = useSpaces();
  const { showOnboarding } = useOnboarding();

  useEffect(() => {
    const space = spaces.find(_space => _space.domain === router.query.domain);
    if (space) {
      router.push(`/${router.query.domain}`);
      showOnboarding(space.id);
    }
  }, [spaces]);

  return (
    <Box sx={{ width: 600, maxWidth: '100%', mx: 'auto', mb: 6, px: 2 }}>
      <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
        <DialogTitle>Join a workspace</DialogTitle>
        <Divider />
        {domain ? <JoinPredefinedSpaceDomain spaceDomain={domain as string} /> : <JoinDynamicSpaceForm />}
      </Card>
      <AlternateRouteButton href='/createWorkspace'>
        Create a workspace
      </AlternateRouteButton>
    </Box>
  );
}

JoinWorkspace.getLayout = getBaseLayout;
