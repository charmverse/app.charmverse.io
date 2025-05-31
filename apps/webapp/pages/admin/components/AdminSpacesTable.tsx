import { log } from '@charmverse/core/log';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider } from '@mui/material';
import { isProdEnv } from '@packages/config/constants';
import { withSessionSsr } from '@packages/lib/session/withSession';
import { capitalize } from '@packages/utils/strings';
import type { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';

import { useAdminSpaces } from 'charmClient/hooks/admin';
import { Avatar } from 'components/common/Avatar';
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
  const searchDebounced = useDebouncedValue(searchInputValue, 200);
  const {
    data: spaces,
    isLoading,
    isValidating
  } = useAdminSpaces({
    name: searchDebounced
  });

  return (
    <Paper>
      <Box p={2} maxWidth='500px'>
        <TextInputField
          label='Search spaces by name'
          value={searchInputValue}
          placeholder='Enter name'
          onChange={(e) => setSearchInputValue(e.target.value)}
        />
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell>Price Override</TableCell>
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
