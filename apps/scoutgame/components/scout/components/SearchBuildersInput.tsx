'use client';

import SearchIcon from '@mui/icons-material/Search';
import type { SxProps } from '@mui/material';
import { Autocomplete, Box, CircularProgress, InputAdornment, TextField, Typography, styled } from '@mui/material';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import Link from 'next/link';
import { useState } from 'react';

import { useSearchBuilders } from 'hooks/api/builders';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type { BuilderSearchResult } from 'lib/builders/searchBuilders';

const StyledAutocomplete = styled(Autocomplete<BuilderSearchResult>)({
  '& .MuiAutocomplete-popper': {
    zIndex: 1100
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: '20px'
  },
  '& .MuiAutocomplete-paper': {
    borderRadius: '10px'
  }
});
export function SearchBuildersInput({ sx }: { sx?: SxProps }) {
  const [open, setOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 200);
  const { data: searchResults, isLoading } = useSearchBuilders(debouncedSearchTerm);
  // delay the loading state to avoid flickering
  const debouncedIsLoading = useDebouncedValue(isLoading, 500);

  return (
    <StyledAutocomplete
      loading={debouncedIsLoading}
      loadingText='Loading...'
      size='small'
      renderOption={(props, option, { inputValue }) => {
        if (inputValue && inputValue.length >= 2 && searchResults?.length === 0) {
          return (
            <Box component='li' {...props} sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          );
        }
        return (
          <li {...props}>
            <Link href={`/u/${option.path}`} passHref legacyBehavior>
              <Box
                component='a'
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <Avatar src={option.avatar} alt={option.displayName} sx={{ mr: 2 }} />
                <Typography variant='body1'>{option.displayName}</Typography>
              </Box>
            </Link>
          </li>
        );
      }}
      fullWidth
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={searchResults ?? []}
      getOptionLabel={(option) => option.displayName}
      onInputChange={(event, value) => setSearchTerm(value)}
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth
          variant='outlined'
          placeholder='Search for builders'
          // onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              )
            }
          }}
        />
      )}
      noOptionsText='Search'
      sx={sx}
    />
  );
}
