import { connectApiClient } from '@connect/apiClient/apiClient';
import { Avatar } from '@connect/components/common/Avatar';
import type { StatusAPIResponse } from '@farcaster/auth-kit';
import type { BoxProps } from '@mui/material';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';

type FarcasterProfile = Pick<StatusAPIResponse, 'fid' | 'pfpUrl' | 'bio' | 'displayName' | 'username'>;

export function SearchFarcasterUser({
  setSelectedProfile
}: {
  setSelectedProfile: (profile: FarcasterProfile | null) => void;
}) {
  const [farcasterProfiles, setFarcasterProfiles] = useState<FarcasterProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedGetPublicSpaces = useMemo(() => {
    return debounce((_searchTerm: string) => {
      connectApiClient
        .getFarcasterUsersByUsername(_searchTerm)
        .then((_farcasterProfiles) => {
          if (_farcasterProfiles.length) {
            setFarcasterProfiles(
              _farcasterProfiles.map((profile) => ({
                fid: profile.fid,
                pfpUrl: profile.pfp_url,
                bio: profile.profile.bio.text,
                displayName: profile.display_name,
                username: profile.username
              }))
            );
          }
        })
        .catch(() => {
          setFarcasterProfiles([]);
        });
    }, 500);
  }, []);

  useEffect(() => {
    if (searchTerm && searchTerm.length >= 3) {
      debouncedGetPublicSpaces(searchTerm);
    } else {
      setFarcasterProfiles([]);
    }
  }, [searchTerm]);

  return (
    <Autocomplete<FarcasterProfile, false, true>
      disablePortal
      inputValue={searchTerm}
      onChange={(_, newValue) => {
        setSearchTerm('');
        setSelectedProfile(newValue);
      }}
      getOptionLabel={(option) => `${option.username} ${option.fid}`}
      fullWidth
      options={farcasterProfiles}
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
