'use client';

import {
  MoreHoriz as MoreHorizIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import {
  Button,
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
  TableSortLabel,
  Select,
  MenuItem,
  ListItemText,
  FormControl,
  InputLabel
} from '@mui/material';
import { capitalize } from '@packages/utils/strings';
import React, { useState, useMemo } from 'react';

import { FileDownloadButton } from 'components/common/FileDownloadButton';
import { useSearchUsers } from 'hooks/api/users';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type { SortField, SortOrder, ScoutGameUser } from 'lib/users/getUsers';

import { AddUserButton } from './components/AddUserButton/AddUserButton';
import { UserActionButton } from './components/UserActions/UserActionButton';

export function UsersDashboard({ users }: { users: ScoutGameUser[] }) {
  const [filterString, setFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [builderFilter, setBuilderFilter] = useState<BuilderStatus | undefined>(undefined);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const debouncedFilterString = useDebouncedValue(filterString);
  const {
    data: filteredUsers,
    isValidating,
    mutate: refreshUsers,
    isLoading
  } = useSearchUsers({ searchString: debouncedFilterString, sortField, builderStatus: builderFilter, sortOrder });
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
        <Box sx={{ display: 'flex', gap: 2 }}>
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
          <FormControl sx={{ width: 150 }}>
            <InputLabel size='small'>Builder status</InputLabel>
            <Select
              value={builderFilter || ''}
              onChange={(e) => setBuilderFilter(e.target.value || undefined)}
              label='Builder status'
            >
              <MenuItem value=''>
                <em>None</em>
              </MenuItem>
              {['applied', 'approved', 'rejected', 'banned'].map((status) => (
                <MenuItem key={status} value={status}>
                  {status === 'banned' ? 'Suspended' : capitalize(status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <AddUserButton variant='contained' color='primary' startIcon={<AddIcon />}>
            Add
          </AddUserButton>
          <FileDownloadButton variant='outlined' filename='scoutgame_users.tsv' src='/api/users/export'>
            Export
          </FileDownloadButton>
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
              <TableCell>Email</TableCell>
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
                <TableCell>{user.email}</TableCell>
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
                  <UserActionButton user={user} onChange={refreshUsers} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
