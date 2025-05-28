import type { Space } from '@charmverse/core/prisma-client';
import { styled } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Autocomplete, IconButton, Popper, Stack, TextField, Typography, Box } from '@mui/material';
import debounce from 'lodash/debounce';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';

import AvatarWithIcons from '../AvatarWithIcons';
import FieldLabel from '../form/FieldLabel';

import { SpaceAccessGate } from './SpaceAccessGate';

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
  defaultValue?: string;
  goBack?: () => void;
};

export function SpaceAccessGateWithSearch({ defaultValue, goBack }: Props) {
  const router = useRouter();
  const [spaceDomain, setSpaceDomain] = useState<string>(defaultValue || '');
  const [spacesInfo, setSpacesInfo] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<null | Space>(null);

  async function goToSpace(domain: string) {
    router.push(`/${domain}`);
  }

  const debouncedGetPublicSpaces = useMemo(() => {
    return debounce((spaceName: string) => {
      charmClient.spaces
        .searchByName(spaceName)
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
    <Box minWidth='300px' maxWidth='100%'>
      <br />
      <FieldLabel sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        {goBack && (
          <IconButton size='small' onClick={goBack}>
            <ArrowBackIosNewIcon />
          </IconButton>
        )}
        Search by name
      </FieldLabel>
      <Autocomplete<Space>
        disablePortal
        inputValue={spaceDomain}
        options={spacesInfo}
        value={selectedSpace}
        onChange={(_e, _space) => {
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
      {selectedSpace && <SpaceAccessGate onSuccess={() => goToSpace(selectedSpace.domain)} space={selectedSpace} />}
    </Box>
  );
}
