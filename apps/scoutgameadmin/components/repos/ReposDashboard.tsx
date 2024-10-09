'use client';

import { Clear as ClearIcon } from '@mui/icons-material';
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

import { useSearchRepos } from 'hooks/api/repos';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type { Repo } from 'lib/repos/getRepos';

import { AddRepoButton } from './AddRepoButton/AddRepoButton';
import { ExportButton } from './ExportButton';

type SortField = 'commits' | 'prs' | 'closedPrs' | 'contributors' | 'owner' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function ReposDashboard({ repos }: { repos: Repo[] }) {
  const [filterString, setFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const debouncedFilterString = useDebouncedValue(filterString);
  const { data: filteredRepos, isValidating, isLoading } = useSearchRepos(debouncedFilterString);
  const showFilteredResults = Boolean(debouncedFilterString || filteredRepos || isValidating || isLoading);

  const filteredAndSortedRepos = useMemo(() => {
    if (showFilteredResults) {
      return filteredRepos || [];
    }
    return repos.sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
      // sort by name as a secondary sort if the field is the same
      if (a[sortField] === b[sortField]) return a.name.localeCompare(b.name);
      return 0;
    });
  }, [repos, filteredRepos, showFilteredResults, sortField, sortOrder]);

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
      <Typography variant='h4' component='h1' gutterBottom>
        Git Repos Dashboard
      </Typography>
      <Stack direction='row' spacing={2} justifyContent='space-between' alignItems='center' mb={2}>
        <TextField
          label='Search'
          placeholder='Filter by owner or name'
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
          <AddRepoButton variant='contained' color='primary' sx={{ mr: 2 }}>
            Import Repos
          </AddRepoButton>
          <ExportButton variant='outlined' filename='github_repos.tsv' src='/api/repos/export'>
            Export Repos
          </ExportButton>
        </Box>
      </Stack>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'owner'}
                  direction={sortField === 'owner' ? sortOrder : 'asc'}
                  onClick={() => handleSort('owner')}
                >
                  Owner
                </TableSortLabel>
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'createdAt'}
                  direction={sortField === 'createdAt' ? sortOrder : 'asc'}
                  onClick={() => handleSort('createdAt')}
                >
                  Imported at
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'commits'}
                  direction={sortField === 'commits' ? sortOrder : 'asc'}
                  onClick={() => handleSort('commits')}
                >
                  Commits
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'prs'}
                  direction={sortField === 'prs' ? sortOrder : 'asc'}
                  onClick={() => handleSort('prs')}
                >
                  Merged PRs
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'closedPrs'}
                  direction={sortField === 'closedPrs' ? sortOrder : 'asc'}
                  onClick={() => handleSort('closedPrs')}
                >
                  Closed PRs
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'contributors'}
                  direction={sortField === 'contributors' ? sortOrder : 'asc'}
                  onClick={() => handleSort('contributors')}
                >
                  Contributors
                </TableSortLabel>
              </TableCell>
              <TableCell>Deleted</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedRepos.map((repo) => (
              <TableRow key={repo.id}>
                <TableCell>
                  <Link href={`https://github.com/${repo.owner}`} target='_blank'>
                    {repo.owner}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`https://github.com/${repo.owner}/${repo.name}`} target='_blank'>
                    {repo.name}
                  </Link>
                </TableCell>
                <TableCell>{new Date(repo.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{repo.commits}</TableCell>
                <TableCell>{repo.prs}</TableCell>
                <TableCell>{repo.closedPrs}</TableCell>
                <TableCell>{repo.contributors}</TableCell>
                <TableCell>{repo.deletedAt ? 'Yes' : ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
