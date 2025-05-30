import { log } from '@charmverse/core/log';
import { Box, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { isProdEnv } from '@packages/config/constants';
import { withSessionSsr } from '@packages/lib/session/withSession';
import type { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';

import { Avatar } from 'components/common/Avatar';
import { useSpaces } from 'hooks/useSpaces';

const adminWhitelist = [
  'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835', // chris
  '4e1d4522-6437-4393-8ed1-9c56e53235f4', // matt
  'dc521ceb-495e-40cc-940e-3b1cafc7a2e1' // alex
];

export const getServerSideProps: GetServerSideProps = withSessionSsr(async (context) => {
  const sessionUserId = context.req.session?.user?.id;

  if (isProdEnv && !adminWhitelist.includes(sessionUserId)) {
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

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { spaces, isLoaded } = useSpaces();
  const [filteredSpaces, setFilteredSpaces] = useState(spaces);

  useEffect(() => {
    if (spaces) {
      const filtered = spaces
        .filter((space) => space.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 100);
      setFilteredSpaces(filtered);
    }
  }, [searchQuery, spaces]);

  if (!isLoaded) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box p={3}>
      <TextField
        fullWidth
        label='Search spaces'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Space</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell>Monthly Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSpaces.map((space) => (
              <TableRow key={space.id}>
                <TableCell>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Avatar name={space.name} avatar={space.avatar} size='small' />
                    {space.name}
                  </Box>
                </TableCell>
                <TableCell>{space.tier || 'Free'}</TableCell>
                <TableCell>${space.subscriptionMonthlyPrice || 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
