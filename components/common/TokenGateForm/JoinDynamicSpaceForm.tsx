import styled from '@emotion/styled';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Autocomplete, Popper, Stack, TextField, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { Space } from '@prisma/client';
import { debounce } from 'lodash';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';

import AvatarWithIcons from '../AvatarWithIcons';
import FieldLabel from '../form/FieldLabel';

import TokenGateForm from './TokenGateForm';

function stripUrlParts(maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}

const StyledPopper = styled(Popper)`
  height: 0;
`;

/**
 * @goBack - function to go back to the previous step. Used in context of CreateSpaceForm
 */
type Props = {
  goBack?: () => void;
};

export function JoinDynamicSpaceForm({ goBack }: Props) {
  const router = useRouter();
  const [spaceDomain, setSpaceDomain] = useState<string>(router.query.domain as string);
  const [spacesInfo, setSpacesInfo] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<null | Space>(null);

  async function onJoinSpace(joinedSpace: Space) {
    router.push(`/${joinedSpace.domain}`);
  }

  const debouncedGetPublicSpaces = useMemo(() => {
    return debounce((spaceName: string) => {
      charmClient
        .getSpacesByName(spaceName)
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
    } else {
      setSpacesInfo([]);
    }
  }, [spaceDomain]);

  function onChangeDomainName(event: ChangeEvent<HTMLInputElement>) {
    setSpaceDomain(stripUrlParts(event.target.value));
  }

  return (
    <Box sx={{ minHeight: '200px' }}>
      <br />
      <FieldLabel sx={{ display: 'flex', justifyContent: 'center', gap: 2, pb: 1 }}>
        {goBack && <ArrowBackIosNewIcon onClick={goBack} />}
        Enter a CharmVerse space name
      </FieldLabel>
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
          <Box
            data-test={`join-workspace-autocomplete-${space.domain}`}
            component='li'
            sx={{ display: 'flex', gap: 1 }}
            {...props}
          >
            <AvatarWithIcons avatar={space.spaceImage} icons={[]} name={space.name} variant='rounded' size='small' />
            <Stack>
              <Typography component='span'>{space.name}</Typography>
              <Typography variant='subtitle2'>{space.domain}</Typography>
            </Stack>
          </Box>
        )}
        noOptionsText='No spaces found'
        renderInput={(params) => (
          <TextField
            data-test='join-workspace-textfield'
            placeholder='my-space'
            {...params}
            value={spaceDomain}
            onChange={onChangeDomainName}
          />
        )}
      />
      {selectedSpace && <TokenGateForm onSuccess={onJoinSpace} spaceDomain={selectedSpace.domain} />}
    </Box>
  );
}
