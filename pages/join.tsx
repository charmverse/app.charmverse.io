import NavigateNextIcon from '@mui/icons-material/ArrowRightAlt';
import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import { Space } from '@prisma/client';
import charmClient from 'charmClient';
import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import Button from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { DialogTitle } from 'components/common/Modal';
import TokenGateForm from 'components/common/TokenGateForm';
import { useSpaces } from 'hooks/useSpaces';
import { PublicSpaceInfo } from 'lib/spaces/interfaces';
import { useRouter } from 'next/router';
import { ChangeEvent, ReactNode, useEffect, useState } from 'react';

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

function stripUrlParts (maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}

export default function CreateSpace () {

  const router = useRouter();
  const [spaces] = useSpaces();
  const [spaceDomain, setSpaceDomain] = useState<string>('');
  const [spaceInfo, setSpaceInfo] = useState<PublicSpaceInfo | null>(null);
  const [userInputStatus, setStatus] = useState('');

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
    const domain = stripUrlParts(event.target.value);
    setSpaceDomain(domain);
  }

  return (
    <Box sx={{ width: 600, maxWidth: '100%', mx: 'auto', mb: 6, px: 2 }}>
      <Card sx={{ p: 4, mb: 3 }} variant='outlined'>

        <DialogTitle>Join a workspace</DialogTitle>
        <Divider />
        <br />
        <FieldLabel>Enter a CharmVerse Domain or URL</FieldLabel>
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

        {
          spaceInfo && (
            <TokenGateForm onSubmit={onJoinSpace} spaceDomain={spaceDomain} />
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
