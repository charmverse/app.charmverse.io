import type { BoxProps } from '@mui/material';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';

import { Avatar } from 'components/common/Avatar';
import { getFarcasterProfile, type FarcasterProfile } from 'lib/farcaster/getFarcasterUser';

export function SearchFarcasterUser({
  selectedProfile,
  setSelectedProfile
}: {
  selectedProfile: FarcasterProfile | null;
  setSelectedProfile: (profile: FarcasterProfile | null) => void;
}) {
  const [farcasterProfile, setFarcasterProfile] = useState<FarcasterProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedGetPublicSpaces = useMemo(() => {
    return debounce((_searchTerm: string) => {
      getFarcasterProfile({
        fid: _searchTerm,
        username: _searchTerm
      })
        .then((_farcasterProfiles) => {
          if (_farcasterProfiles) {
            setFarcasterProfile(_farcasterProfiles);
          }
        })
        .catch(() => {
          setFarcasterProfile(null);
        });
    }, 500);
  }, []);

  useEffect(() => {
    if (searchTerm && searchTerm.length >= 3) {
      debouncedGetPublicSpaces(searchTerm);
    } else {
      setFarcasterProfile(null);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (selectedProfile === null) {
      setSearchTerm('');
      setFarcasterProfile(null);
    }
  }, [selectedProfile]);

  return (
    <Autocomplete<FarcasterProfile, false, true>
      disablePortal
      inputValue={searchTerm}
      value={selectedProfile ?? undefined}
      onChange={(_, newValue) => {
        setSelectedProfile(newValue);
      }}
      getOptionLabel={(option) => `${option.body.username} ${option.body.id}`}
      fullWidth
      options={farcasterProfile ? [farcasterProfile] : []}
      clearOnBlur={false}
      disableClearable
      clearOnEscape={false}
      renderOption={(props, profile) => {
        return (
          <Box {...(props as BoxProps)} display='flex' alignItems='center' gap={1} flexDirection='row'>
            <Avatar src={profile.body.avatarUrl} size='medium' />
            <Stack>
              <Typography variant='body1'>{profile.body.displayName}</Typography>
              <Typography variant='subtitle2' color='secondary'>
                {profile.body.username} #{profile.body.id}
              </Typography>
            </Stack>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder='Search for a Farcaster user'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}
      noOptionsText='No profiles found'
    />
  );
}
