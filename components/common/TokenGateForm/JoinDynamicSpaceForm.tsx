import styled from '@emotion/styled';
import { Autocomplete, Popper, Stack, TextField, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { Space } from '@prisma/client';
import { debounce } from 'lodash';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { useOnboarding } from 'hooks/useOnboarding';

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
  const [spaceDomain, setSpaceDomain] = useState<string>(router.query.domain as string);
  const [spacesInfo, setSpacesInfo] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<null | Space>(null);
  const { showOnboarding } = useOnboarding();

  async function onJoinSpace (joinedSpace: Space) {
    router.push(`/${joinedSpace.domain}`);
    showOnboarding(joinedSpace.id);
  }

  const debouncedGetPublicSpaces = useMemo(() => {
    return debounce((spaceName: string) => {
      charmClient.getSpacesByName(spaceName)
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
        filterOptions={(x) => x}
        clearOnEscape={false}
        clearOnBlur={false}
        PopperComponent={StyledPopper}
        renderOption={(props, space) => (
          <Box data-test={`join-workspace-autocomplete-${space.domain}`} component='li' sx={{ display: 'flex', gap: 1 }} {...props}>
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
        renderInput={(params) => <TextField data-test='join-workspace-textfield' placeholder='my-space' {...params} value={spaceDomain} onChange={onChangeDomainName} />}
      />
      {selectedSpace && <TokenGateForm onSuccess={onJoinSpace} spaceDomain={selectedSpace.domain} />}
    </>
  );
}
