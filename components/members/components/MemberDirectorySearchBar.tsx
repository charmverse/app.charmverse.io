import SearchIcon from '@mui/icons-material/Search';
import type { Theme } from '@mui/material';
import { useMediaQuery, InputAdornment, TextField } from '@mui/material';
import debounce from 'lodash/debounce';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo } from 'react';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

export function MemberDirectorySearchBar({ onChange }: { onChange: Dispatch<SetStateAction<Member[]>> }) {
  const { members } = useMembers();
  const space = useCurrentSpace();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  useEffect(() => {
    onChange(members);
  }, [members]);

  const debouncedSearchMembers = useMemo(
    () =>
      debounce(async (searchedContent: string) => {
        if (space) {
          const searchResult = await charmClient.members.getMembers(space.id, searchedContent);
          onChange(searchResult);
        }
      }, 1000),
    []
  );

  return (
    <TextField
      placeholder={isSmallScreen ? 'Search for members' : 'Search for members, roles, skills, interests, etc'}
      fullWidth
      sx={{
        my: 2
      }}
      onChange={(e) => {
        const search = e.target.value;
        if (search.length !== 0) {
          debouncedSearchMembers(search);
        } else {
          onChange(members);
        }
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position='end'>
            <SearchIcon color='secondary' />
          </InputAdornment>
        )
      }}
    />
  );
}
