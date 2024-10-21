'use client';

import { ArrowDropDown as ArrowDropDownIcon, Add as AddIcon, Clear as ClearIcon } from '@mui/icons-material';
import {
  CircularProgress,
  Container,
  InputAdornment,
  Link,
  Typography,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  IconButton,
  TableSortLabel
} from '@mui/material';
import React, { useState, useMemo } from 'react';

import { ExportButton } from 'components/common/ExportButton';
import { useSearchUsers } from 'hooks/api/users';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type { SortField, SortOrder, ScoutGameUser } from 'lib/users/getUsers';

import { AddUserButton } from './AddUserButton/AddUserButton';
import { ViewTransactionsButton } from './ViewTransactionsButton/ViewTransactionsButton';

export function UsersDashboard({ users }: { users: ScoutGameUser[] }) {
  const [filterString, setFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const debouncedFilterString = useDebouncedValue(filterString);
  const {
    data: filteredUsers,
    isValidating,
    isLoading
  } = useSearchUsers({ searchString: debouncedFilterString, sortField, sortOrder });
  const showFilteredResults = Boolean(debouncedFilterString || filteredUsers || isValidating || isLoading);

  const filteredAndSortedUsers = useMemo(() => {
    if (showFilteredResults) {
      return filteredUsers || [];
    }
    return users.sort((a, b) => {
      if (!a[sortField] && !b[sortField]) {
        return 0;
      }
      if (!a[sortField]) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (!b[sortField]) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      if (a[sortField]! < b[sortField]!) return sortOrder === 'asc' ? -1 : 1;
      if (a[sortField]! > b[sortField]!) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, filteredUsers, showFilteredResults, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <Container maxWidth='xl'>
      <Stack direction='row' spacing={2} justifyContent='space-between' alignItems='center' mb={2}>
        <TextField
          label='Search'
          placeholder='Filter by name, id, wallet address, email or fid'
          variant='outlined'
          value={filterString}
          onChange={(e) => setFilter(e.target.value)}
          size='small'
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position='end'>
                  {(isLoading || isValidating) && <CircularProgress size={20} />}
                  {filterString && (
                    <IconButton aria-label='clear search' size='small' onClick={() => setFilter('')} edge='end'>
                      <ClearIcon fontSize='small' />
                    </IconButton>
                  )}
                </InputAdornment>
              )
            }
          }}
        />
        <Box>
          <AddUserButton variant='contained' color='primary' sx={{ mr: 2 }} startIcon={<AddIcon />}>
            Add
          </AddUserButton>
          <ExportButton variant='outlined' filename='scoutgame_users.tsv' src='/api/users/export'>
            Export
          </ExportButton>
        </Box>
      </Stack>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'username'}
                  direction={sortField === 'username' ? sortOrder : 'asc'}
                  onClick={() => handleSort('username')}
                >
                  Username
                </TableSortLabel>
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Farcaster ID</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'builderStatus'}
                  direction={sortField === 'builderStatus' ? sortOrder : 'asc'}
                  onClick={() => handleSort('builderStatus')}
                >
                  Builder Status
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'currentBalance'}
                  direction={sortField === 'currentBalance' ? sortOrder : 'asc'}
                  onClick={() => handleSort('currentBalance')}
                >
                  Points Balance
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'nftsPurchased'}
                  direction={sortField === 'nftsPurchased' ? sortOrder : 'asc'}
                  onClick={() => handleSort('nftsPurchased')}
                >
                  NFTs Purchased
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'createdAt'}
                  direction={sortField === 'createdAt' ? sortOrder : 'asc'}
                  onClick={() => handleSort('createdAt')}
                >
                  Created At
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.farcasterId}</TableCell>
                <TableCell>{user.builderStatus || 'N/A'}</TableCell>
                <TableCell>{user.currentBalance}</TableCell>
                <TableCell>
                  <ViewTransactionsButton size='small' variant='outlined' scoutId={user.id}>
                    {user.nftsPurchased}
                  </ViewTransactionsButton>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
