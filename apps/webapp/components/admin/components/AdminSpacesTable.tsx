import { log } from '@charmverse/core/log';
import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { isProdEnv } from '@packages/config/constants';
import { withSessionSsr } from '@packages/lib/session/withSession';
import { capitalize } from '@packages/utils/strings';
import type { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';

import { useAdminSpaces } from 'charmClient/hooks/admin';
import { Avatar } from 'components/common/Avatar';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import { whitelist } from 'lib/admin/users';

export const getServerSideProps: GetServerSideProps = withSessionSsr(async (context) => {
  const sessionUserId = context.req.session?.user?.id;

  if (isProdEnv && !whitelist.includes(sessionUserId)) {
    log.warn('User attempted to access admin page', { userId: sessionUserId });
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    };
  }
  log.info('User accessed admin page', { userId: sessionUserId });

  return {
    props: {}
  };
});

export function AdminSpacesTable() {
  const [searchInputValue, setSearchInputValue] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState<SpaceSubscriptionTier | null>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const searchDebounced = useDebouncedValue(searchInputValue, 200);
  const {
    data: spaces,
    isLoading,
    isValidating
  } = useAdminSpaces({
    name: searchDebounced,
    sortField: sortField || undefined,
    sortDirection: sortDirection || undefined,
    subscriptionTier: subscriptionTier || undefined
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <Paper>
      <Box display='flex' width='100%' alignItems='center' gap={2} mb={2}>
        <Box p={2} maxWidth='500px'>
          <TextInputField
            label='Search spaces by name'
            value={searchInputValue}
            placeholder='Enter name'
            onChange={(e) => setSearchInputValue(e.target.value)}
          />
        </Box>
        <FieldWrapper label='Subscription tier' size='small' sx={{ minWidth: 120 }}>
          <Select
            value={subscriptionTier || ''}
            sx={{ width: 150 }}
            onChange={(e) => setSubscriptionTier(e.target.value as SpaceSubscriptionTier | null)}
            displayEmpty
          >
            <MenuItem value=''>All</MenuItem>
            <MenuItem value='readonly'>Readonly</MenuItem>
            <MenuItem value='free'>Free</MenuItem>
            <MenuItem value='silver'>Silver</MenuItem>
            <MenuItem value='gold'>Gold</MenuItem>
            <MenuItem value='grant'>Grant</MenuItem>
          </Select>
        </FieldWrapper>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell onClick={() => handleSort('name')} sx={{ cursor: 'pointer' }}>
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell onClick={() => handleSort('createdAt')} sx={{ cursor: 'pointer' }}>
                Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell onClick={() => handleSort('subscriptionTier')} sx={{ cursor: 'pointer' }}>
                Tier {sortField === 'subscriptionTier' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell onClick={() => handleSort('subscriptionMonthlyPrice')} sx={{ cursor: 'pointer' }}>
                Price Override {sortField === 'subscriptionMonthlyPrice' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading || isValidating ? (
              <TableRow>
                <TableCell colSpan={4}>Loading...</TableCell>
              </TableRow>
            ) : (
              spaces?.map((space) => (
                <TableRow key={space.id}>
                  <TableCell sx={{ width: '50%' }}>
                    <Box display='flex' alignItems='center' gap={1}>
                      <Avatar name={space.name} avatar={space.spaceImage} size='small' />
                      {space.name}
                    </Box>
                  </TableCell>
                  <TableCell>{new Date(space.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{capitalize(space.subscriptionTier || 'Free')}</TableCell>
                  <TableCell>{space.subscriptionMonthlyPrice}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
