import { useEffect, ReactNode } from 'react';
import { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import NavigateNextIcon from '@mui/icons-material/ArrowRightAlt';
import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import TokenGateForm from 'components/common/TokenGateForm';
import Button from 'components/common/Button';
import { useSpaces } from 'hooks/useSpaces';

export function AlternateRouteButton ({ href, children }: { href: string, children: ReactNode }) {
  const [spaces] = useSpaces();
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

export default function CreateSpace () {

  const router = useRouter();
  const [spaces] = useSpaces();

  async function onJoinSpace (space: Space) {
    if (typeof router.query.returnUrl === 'string') {
      router.push(router.query.returnUrl);
    }
    else {
      router.push(`/${space.domain}`);
    }
  }

  useEffect(() => {
    if (spaces.some(space => space.domain === router.query.domain)) {
      router.push(`/${router.query.domain}`);
    }
  }, [spaces]);

  return (
    <Box sx={{ width: 600, maxWidth: '100%', mx: 'auto', mb: 6, px: 2 }}>
      <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
        <TokenGateForm onSubmit={onJoinSpace} />
      </Card>
      <AlternateRouteButton href='/createWorkspace'>
        Create a workspace
      </AlternateRouteButton>
    </Box>
  );
}

CreateSpace.getLayout = getBaseLayout;
