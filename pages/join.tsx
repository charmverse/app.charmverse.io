import NavigateNextIcon from '@mui/icons-material/ArrowRightAlt';
import type { PopperProps } from '@mui/material';
import { Autocomplete, Popper, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import type { Space } from '@prisma/client';
import debounce from 'lodash/debounce';
import { useRouter } from 'next/router';
import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import AvatarWithIcons from 'components/common/AvatarWithIcons';
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
  const [spacesInfo, setSpacesInfo] = useState<Space[]>([]);
  const [userInputStatus, setStatus] = useState('');
  const [selectedSpace, setSelectedSpace] = useState<null | Space>(null);

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

  const debouncedGetPublicSpaces = useMemo(() => {
    return debounce((_spaceDomain: string) => {
      charmClient.getPublicSpacesInfo(_spaceDomain)
        .then((_spaces) => {
          setSpacesInfo(_spaces);
          setStatus('');
        })
        .catch(() => {
          setSpacesInfo([]);
          setStatus('Workspace not found');
        });
    }, 500);
  }, []);

  useEffect(() => {
    if (spaceDomain && spaceDomain.length > 3) {
      debouncedGetPublicSpaces(spaceDomain);
    }
    else {
      setSpacesInfo([]);
      setStatus('');
    }

  }, [spaceDomain]);

  const [spaceInfo] = spacesInfo;

  function onChangeDomainName (event: ChangeEvent<HTMLInputElement>) {
    setSpaceDomain(stripUrlParts(event.target.value));
  }

  const popperFactoryMemoized = useMemo(() => {
    return function factory ({ style, ...props }: PopperProps) {
      return (
        <Popper
          {...props}
          style={{ ...style, height: 0 }}
        />
      );
    };
  }, []);

  return (
    <Box sx={{ width: 600, maxWidth: '100%', mx: 'auto', mb: 6, px: 2 }}>
      <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
        <DialogTitle>Join a workspace</DialogTitle>
        <Divider />
        {spaceInfo && domain && (
          <>
            <Card sx={{ p: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
              <Box mb={3}>
                <WorkspaceAvatar image={spaceInfo.spaceImage} name={spaceInfo.name} variant='rounded' />
              </Box>
              <Box display='flex' flexDirection='column' alignItems='center'>
                <Typography variant='h5'>{spaceInfo.name}</Typography>
              </Box>
            </Card>
            {
              spaceInfo && (
                <TokenGateForm onSuccess={onJoinSpace} spaceDomain={spaceDomain} />
              )
            }
          </>
        )}
        {/* If there is no domain param in the url, show the text input to search for workspaces */}
        {!domain && (
          <>
            <br />
            <FieldLabel>Enter a CharmVerse workspace name</FieldLabel>
            <Autocomplete<Space>
              disablePortal
              options={spacesInfo}
              placeholder='my-space'
              value={selectedSpace}
              onChange={(e, _space) => {
                setSelectedSpace(_space);
              }}
              getOptionLabel={(space) => space.name}
              fullWidth
              PopperComponent={popperFactoryMemoized}
              renderOption={(props, space) => (
                <Box component='li' sx={{ display: 'flex', gap: 1 }} {...props}>
                  <AvatarWithIcons
                    avatar={space.spaceImage}
                    icons={[]}
                    name={space.name}
                    variant='rounded'
                    size='small'
                  />
                  <Stack>
                    <Typography component='span'>
                      {space.name}
                    </Typography>
                    <Typography variant='subtitle2'>
                      {space.domain}
                    </Typography>
                  </Stack>
                </Box>
              )}
              noOptionsText='No spaces found'
              renderInput={(params) => <TextField placeholder='my-space' {...params} value={spaceDomain} onChange={onChangeDomainName} />}
            />
            {selectedSpace && <TokenGateForm onSuccess={onJoinSpace} spaceDomain={selectedSpace.domain} />}
          </>
        )}
      </Card>
      <AlternateRouteButton href='/createWorkspace'>
        Create a workspace
      </AlternateRouteButton>
    </Box>
  );
}

CreateSpace.getLayout = getBaseLayout;
