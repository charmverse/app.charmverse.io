'use client';

import SearchIcon from '@mui/icons-material/Search';
import { TextField, InputAdornment, Autocomplete, Box, Typography, styled, Stack } from '@mui/material';
import debounce from 'lodash/debounce';
import React, { useState, useEffect, useMemo } from 'react';

import { Avatar } from 'components/common/Avatar';
import { searchBuilders } from 'lib/apiClient/builders';
import type { BuilderSearchResult } from 'lib/builders/searchBuilders';

const Overlay = styled('div')({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 1000
});

const StyledAutocomplete = styled(Autocomplete<User>)({
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

export function SearchInput() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<BuilderSearchResult[]>([]);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const searchBuildersDebounced = useMemo(() => {
    return debounce((_searchTerm: string) => {
      searchBuilders(_searchTerm)
        .then((result) => {
          setOptions(result);
        })
        .catch(() => {
          setOptions([]);
        });
    }, 500);
  }, []);

  useEffect(() => {
    if (searchTerm && searchTerm.length >= 2) {
      searchBuildersDebounced(searchTerm);
    } else {
      setOptions([]);
    }
  }, [searchTerm, searchBuildersDebounced]);

  return (
    <>
      {open && <Overlay />}
      <StyledAutocomplete
        fullWidth
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        options={options}
        getOptionLabel={(option) => option.username}
        onInputChange={(event, value) => setSearchTerm(value)}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            variant='outlined'
            placeholder='Search...'
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
        noOptionsText='Search by username'
        renderOption={(props, option) => (
          <Box component='li' {...props}>
            <Avatar src={option.avatar} alt={option.name} sx={{ mr: 2 }} />
            <Typography variant='body1'>{option.name}</Typography>
          </Box>
        )}
      />
    </>
  );
}
