import NavigateNextIcon from '@mui/icons-material/ArrowRightAlt';
import CheckIcon from '@mui/icons-material/Check';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import type { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import Button from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { DialogTitle } from 'components/common/Modal';
import TokenGateForm from 'components/common/TokenGateForm';
import WorkspaceAvatar from 'components/settings/workspace/LargeAvatar';
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

function stripUrlParts (maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}

export default function CreateSpace () {

  const router = useRouter();
  const { spaces } = useSpaces();
  const [spaceDomain, setSpaceDomain] = useState<string>('');
  const [spaceInfo, setSpaceInfo] = useState<Space | null>(null);
  const [userInputStatus, setStatus] = useState('');

  const domain = router.query.domain;

  async function onJoinSpace (joinedSpace: Space) {
    router.push(`/${joinedSpace.domain}`);
  }

  useEffect(() => {
    if (spaces.some(space => space.domain === router.query.domain)) {
      router.push(`/${router.query.domain}`);
    }
  }, [spaces]);

  useEffect(() => {
    if (router.query.domain) {
      setSpaceDomain(stripUrlParts(router.query.domain as string));
    }
  }, [router.query]);

  useEffect(() => {
    if (spaceDomain && spaceDomain.length > 3) {
      charmClient.getPublicSpaceInfo(spaceDomain)
        .then((_space) => {
          setSpaceInfo(_space);
          setStatus('');
        })
        .catch(() => {
          setSpaceInfo(null);
          setStatus('Workspace not found');
        });
    }
    else {
      setSpaceInfo(null);
      setStatus('');
    }

  }, [spaceDomain]);

  function onChangeDomainName (event: ChangeEvent<HTMLInputElement>) {
    setSpaceDomain(stripUrlParts(event.target.value));
  }

  return (
    <Box sx={{ width: 600, maxWidth: '100%', mx: 'auto', mb: 6, px: 2 }}>
      <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
        <DialogTitle>Join a workspace</DialogTitle>
        <Divider />

        {spaceInfo && (
          <Card sx={{ p: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <Box mb={3}>
              <WorkspaceAvatar image={spaceInfo.spaceImage} name={spaceInfo.name} variant='rounded' />
            </Box>
            <Box display='flex' flexDirection='column' alignItems='center'>
              <Typography variant='h5'>{spaceInfo.name}</Typography>
            </Box>
          </Card>
        )}
        {/* If there is no domain param in the url, show the text input to search for workspaces */}
        {!domain && (
          <>
            <FieldLabel>Enter a CharmVerse workspace name</FieldLabel>
            <TextField
              onChange={onChangeDomainName}
              autoFocus
              placeholder='https://app.charmverse.io/my-space'
              fullWidth
              value={spaceDomain}
              helperText={userInputStatus}
              InputProps={{
                endAdornment: spaceInfo && <CheckIcon color='success' />
              }}
            />
          </>
        )}
        {
          spaceInfo && (
            <TokenGateForm onSuccess={onJoinSpace} spaceDomain={spaceDomain} />
          )
        }

      </Card>
      <AlternateRouteButton href='/createWorkspace'>
        Create a workspace
      </AlternateRouteButton>
    </Box>
  );
}

CreateSpace.getLayout = getBaseLayout;
