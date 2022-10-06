import styled from '@emotion/styled';
import { Autocomplete, Popper, Stack, TextField, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { Space } from '@prisma/client';
import { debounce } from 'lodash';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { useSpaces } from 'hooks/useSpaces';

import AvatarWithIcons from '../AvatarWithIcons';
import FieldLabel from '../form/FieldLabel';

import TokenGateForm from './TokenGateForm';

function stripUrlParts (maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}

const StyledPopper = styled(Popper)`
  height: 0;
`;

export function JoinDynamicSpaceForm () {
  const router = useRouter();
  const { spaces } = useSpaces();
  const [spaceDomain, setSpaceDomain] = useState<string>('');
  const [spacesInfo, setSpacesInfo] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<null | Space>(null);

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
        })
        .catch(() => {
          setSpacesInfo([]);
        });
    }, 500);
  }, []);

  useEffect(() => {
    if (spaceDomain && spaceDomain.length > 3) {
      debouncedGetPublicSpaces(spaceDomain);
    }
    else {
      setSpacesInfo([]);
    }

  }, [spaceDomain]);

  function onChangeDomainName (event: ChangeEvent<HTMLInputElement>) {
    setSpaceDomain(stripUrlParts(event.target.value));
  }

  return (
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
        PopperComponent={StyledPopper}
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
  );
}
