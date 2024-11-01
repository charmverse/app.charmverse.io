'use client';

import {
  MoreHoriz as MoreHorizIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Add as AddIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import {
  CircularProgress,
  Container,
  InputAdornment,
  Link,
  Avatar,
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
  Typography,
  TableSortLabel
} from '@mui/material';
import React, { useState, useMemo } from 'react';

import { ExportButton } from 'components/common/ExportButton';
import { useSearchUsers } from 'hooks/api/users';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type { SortField, SortOrder, ScoutGameUser } from 'lib/users/getUsers';

import { AddUserButton } from './AddUserButton/AddUserButton';
import { UserActionButton } from './UserActionButton/UserActionButton';

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
                  {(isLoading || isValidating) && filterString && <CircularProgress size={20} />}
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
                  active={sortField === 'displayName'}
                  direction={sortField === 'displayName' ? sortOrder : 'asc'}
                  onClick={() => handleSort('displayName')}
                ></TableSortLabel>
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell align='center'>
                <TableSortLabel
                  active={sortField === 'nftsPurchased'}
                  direction={sortField === 'nftsPurchased' ? sortOrder : 'asc'}
                  onClick={() => handleSort('nftsPurchased')}
                >
                  NFTs Purchased
                </TableSortLabel>
              </TableCell>
              <TableCell align='center'>
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
                  active={sortField === 'createdAt'}
                  direction={sortField === 'createdAt' ? sortOrder : 'asc'}
                  onClick={() => handleSort('createdAt')}
                >
                  Created At
                </TableSortLabel>
              </TableCell>
              <TableCell align='center'>
                <TableSortLabel
                  active={sortField === 'builderStatus'}
                  direction={sortField === 'builderStatus' ? sortOrder : 'asc'}
                  onClick={() => handleSort('builderStatus')}
                >
                  Builder Status
                </TableSortLabel>
              </TableCell>
              <TableCell>{/** Actions */}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link
                    target='_blank'
                    href={`https://scoutgame.xyz/u/${user.path}`}
                    sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    <Avatar src={user.avatar || undefined} sx={{ width: 36, height: 36 }} />
                    {user.displayName}
                  </Link>
                </TableCell>
                <TableCell>{user.id}</TableCell>
                <TableCell align='center'>{user.nftsPurchased}</TableCell>
                <TableCell align='center'>{user.currentBalance}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align='center'>
                  {user?.builderStatus === 'approved' && <Typography color='success'>Approved</Typography>}
                  {user?.builderStatus === 'rejected' && <Typography color='error'>Rejected</Typography>}
                  {user?.builderStatus === 'banned' && <Typography color='error'>Suspended</Typography>}
                  {user?.builderStatus === 'applied' && <Typography color='warning'>Applied</Typography>}
                  {!user?.builderStatus && <Typography color='secondary'>&ndash;</Typography>}
                </TableCell>
                <TableCell align='center'>
                  <UserActionButton user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
