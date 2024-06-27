import { Avatar } from '@connect/components/common/Avatar';
import type { StatusAPIResponse } from '@farcaster/auth-kit';
import type { BoxProps } from '@mui/material';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';

import { getFarcasterProfile } from 'lib/farcaster/getFarcasterProfile';

type FarcasterProfile = Pick<StatusAPIResponse, 'fid' | 'pfpUrl' | 'bio' | 'displayName' | 'username'>;

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
            setFarcasterProfile({
              fid: _farcasterProfiles.body.id,
              pfpUrl: _farcasterProfiles.body.avatarUrl,
              bio: _farcasterProfiles.body.bio,
              displayName: _farcasterProfiles.body.displayName,
              username: _farcasterProfiles.body.username
            });
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
      getOptionLabel={(option) => `${option.username} ${option.fid}`}
      fullWidth
      options={farcasterProfile ? [farcasterProfile] : []}
      clearOnBlur={false}
      disableClearable
      clearOnEscape={false}
      renderOption={(props, profile) => {
        return (
          <Box {...(props as BoxProps)} display='flex' alignItems='center' gap={1} flexDirection='row'>
            <Avatar src={profile.pfpUrl} size='medium' />
            <Stack>
              <Typography variant='body1'>{profile.displayName}</Typography>
              <Typography variant='subtitle2' color='secondary'>
                {profile.username} #{profile.fid}
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
