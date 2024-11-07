'use client';

import { log } from '@charmverse/core/log';
import { Clear as ClearIcon } from '@mui/icons-material';
import {
  Stack,
  CircularProgress,
  Container,
  InputAdornment,
  Link,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  IconButton,
  TableSortLabel,
  Button
} from '@mui/material';
import { bonusPartnersRecord } from '@packages/scoutgame/bonus';
import Image from 'next/image';
import React, { useState, useMemo } from 'react';

import { ExportButton } from 'components/common/ExportButton';
import { useSearchRepos } from 'hooks/api/repos';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import { revalidatePathAction } from 'lib/actions/revalidatePathAction';
import type { Repo } from 'lib/repos/getRepos';

import { HeaderActions } from './components/HeaderActions';
import { RepoActionButton } from './components/RepoActions/RepoActionButton';

type SortField = 'commits' | 'prs' | 'closedPrs' | 'contributors' | 'owner' | 'createdAt' | 'bonusPartner';
type SortOrder = 'asc' | 'desc';

export function ReposDashboard({ repos }: { repos: Repo[] }) {
  const [filterString, setFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const debouncedFilterString = useDebouncedValue(filterString);
  const { data: filteredRepos, mutate, isValidating, isLoading } = useSearchRepos(debouncedFilterString);
  const showFilteredResults = Boolean(debouncedFilterString || filteredRepos || isValidating || isLoading);

  const filteredAndSortedRepos = useMemo(() => {
    if (showFilteredResults) {
      return filteredRepos || [];
    }
    return repos.sort((a, b) => {
      if (!a[sortField]) return sortOrder === 'asc' ? -1 : 1;
      if (!b[sortField]) return sortOrder === 'asc' ? 1 : -1;
      if (a[sortField]! < b[sortField]!) return sortOrder === 'asc' ? -1 : 1;
      if (a[sortField]! > b[sortField]!) return sortOrder === 'asc' ? 1 : -1;
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

  function refreshData() {
    if (filterString) {
      mutate();
    } else {
      revalidatePathAction();
    }
  }

  return (
    <Container maxWidth='xl'>
      <Stack direction='row' spacing={2} justifyContent='space-between' alignItems='center' mb={2}>
        <TextField
          label='Search'
          placeholder='Filter by owner'
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
        <HeaderActions />
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
              <TableCell>
                <TableSortLabel
                  active={sortField === 'bonusPartner'}
                  direction={sortField === 'bonusPartner' ? sortOrder : 'asc'}
                  onClick={() => handleSort('bonusPartner')}
                >
                  Bonus Partner
                </TableSortLabel>
              </TableCell>
              <TableCell align='center'>{/** Actions */}</TableCell>
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
                <TableCell>{repo.commits}</TableCell>
                <TableCell>{repo.prs}</TableCell>
                <TableCell>{repo.closedPrs}</TableCell>
                <TableCell>{repo.contributors}</TableCell>
                <TableCell>
                  {repo.bonusPartner ? <BonusPartnersDisplay bonusPartner={repo.bonusPartner} /> : ''}
                </TableCell>
                <TableCell align='center'>
                  <RepoActionButton
                    repo={repo}
                    onChange={() => {
                      refreshData();
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

function BonusPartnersDisplay({ bonusPartner, size = 20 }: { bonusPartner: string; size?: number }) {
  const info = bonusPartnersRecord[bonusPartner];
  if (!info) {
    log.warn(`No partner info found for ${bonusPartner}`);
    return null;
  }
  return (
    <Stack flexDirection='row' gap={1} alignItems='center'>
      <Image width={20} height={20} src={info.icon} alt='Bonus partner' />
      {info.name}
    </Stack>
  );
}
