import { log } from '@charmverse/core/log';
import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { Edit as EditIcon } from '@mui/icons-material';
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
  Select,
  MenuItem,
  IconButton,
  TextField,
  Stack,
  Typography,
  InputAdornment
} from '@mui/material';
import { isProdEnv } from '@packages/config/constants';
import { withSessionSsr } from '@packages/lib/session/withSession';
import { capitalize } from '@packages/utils/strings';
import type { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';

import { useAdminSpaces, useGetSpaceTokenBalance, useUpdateSpace } from 'charmClient/hooks/admin';
import { Avatar } from 'components/common/Avatar';
import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import Modal from 'components/common/Modal';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import { useSnackbar } from 'hooks/useSnackbar';
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
  const [editingSpace, setEditingSpace] = useState<{
    id: string;
    tier: SpaceSubscriptionTier;
    price: number | null;
  } | null>(null);
  const [newTier, setNewTier] = useState<SpaceSubscriptionTier | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const { showMessage } = useSnackbar();
  const { trigger: updateSpace } = useUpdateSpace();
  const searchDebounced = useDebouncedValue(searchInputValue, 200);
  const { data: spaceTokenBalance, isLoading: isSpaceTokenBalanceLoading } = useGetSpaceTokenBalance(editingSpace?.id);
  const {
    data: spaces,
    isLoading,
    isValidating,
    mutate: refreshSpaces
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

  const handleEditClick = (space: {
    id: string;
    subscriptionTier: SpaceSubscriptionTier | null;
    subscriptionMonthlyPrice: number | null;
  }) => {
    setEditingSpace({
      id: space.id,
      tier: space.subscriptionTier || 'free',
      price: space.subscriptionMonthlyPrice
    });
    setNewTier(space.subscriptionTier || 'free');
    setNewPrice(space.subscriptionMonthlyPrice?.toString() || '');
  };

  const handleSave = async () => {
    if (!editingSpace || !newTier) return;

    // Validate subscription tier
    const validTiers = ['readonly', 'free', 'bronze', 'silver', 'gold', 'grant'] as const;
    if (!validTiers.includes(newTier as any)) {
      showMessage('Invalid subscription tier', 'error');
      return;
    }

    // Validate price
    if (newPrice !== null && newPrice !== undefined) {
      const price = Number(newPrice);
      if (Number.isNaN(price) || price < 0) {
        showMessage('Invalid subscription price', 'error');
        return;
      }
    }

    try {
      await updateSpace({
        id: editingSpace.id,
        subscriptionTier: newTier,
        subscriptionMonthlyPrice: newPrice ? Number(newPrice) : null
      });
      showMessage('Space updated successfully', 'success');
      refreshSpaces();
      setEditingSpace(null);
    } catch (error) {
      showMessage('Failed to update space', 'error');
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
        <FieldWrapper label='Subscription tier' sx={{ minWidth: 120 }}>
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading || isValidating ? (
              <TableRow>
                <TableCell colSpan={5}>Loading...</TableCell>
              </TableRow>
            ) : (
              spaces?.map((space) => (
                <TableRow key={space.id}>
                  <TableCell sx={{ width: '50%' }}>
                    <Box display='flex' alignItems='center' gap={1}>
                      <Avatar name={space.name} avatar={space.spaceImage} size='small' />
                      <Stack>
                        <Typography>{space.name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {space.domain}
                        </Typography>
                      </Stack>
                    </Box>
                  </TableCell>
                  <TableCell>{new Date(space.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{capitalize(space.subscriptionTier || 'Free')}</TableCell>
                  <TableCell>{space.subscriptionMonthlyPrice}</TableCell>
                  <TableCell>
                    <IconButton size='small' onClick={() => handleEditClick(space)}>
                      <EditIcon fontSize='small' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={!!editingSpace} onClose={() => setEditingSpace(null)}>
        <Stack gap={2}>
          <Box>
            <Typography variant='h6'>Edit Space Subscription</Typography>
            <Typography variant='body2' color='text.secondary'>
              Update the subscription tier and price override for this space
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Space token balance:{' '}
              {isSpaceTokenBalanceLoading ? (
                'Loading...'
              ) : (
                <strong>{spaceTokenBalance?.formatted.toFixed(2)} DEV</strong>
              )}
            </Typography>
          </Box>
          <Divider />
          <Box>
            <FieldLabel>Subscription Tier</FieldLabel>
            <Select
              value={newTier || ''}
              label='Subscription Tier'
              onChange={(e) => setNewTier(e.target.value as SpaceSubscriptionTier)}
            >
              <MenuItem value='readonly'>Readonly</MenuItem>
              <MenuItem value='free'>Free</MenuItem>
              <MenuItem value='silver'>Silver</MenuItem>
              <MenuItem value='gold'>Gold</MenuItem>
              <MenuItem value='grant'>Grant</MenuItem>
            </Select>
          </Box>
          <Box>
            <FieldLabel>Price Override</FieldLabel>
            <TextField
              type='number'
              fullWidth
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position='end'>DEV</InputAdornment>
                }
              }}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              helperText='Leave empty to use default tier price'
            />
          </Box>
          <Box display='flex' justifyContent='flex-end' gap={2}>
            <Button variant='outlined' onClick={() => setEditingSpace(null)}>
              Cancel
            </Button>
            <Button variant='contained' onClick={handleSave}>
              Save Changes
            </Button>
          </Box>
        </Stack>
      </Modal>
    </Paper>
  );
}
