import 'server-only';

import { Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { delay } from '@root/lib/utils/async';
import { DateTime } from 'luxon';
import Image from 'next/image';
import Link from 'next/link';

import { iconMap } from 'components/common/Tabs/iconMap';
import { getAllEvents } from 'lib/builders/getAllEvents';

export async function PublicBuilderActivity() {
  const rows = await getAllEvents();
  await delay(3000);

  // @TODO: Add this back and remove dumy data
  // if (!rows || rows.length === 0) {
  //   return null;
  // }

  return (
    <>
      <Stack justifyContent='space-between' flexDirection='row' my={1}>
        <Typography variant='subtitle1' color='secondary' fontWeight='500'>
          Recent Activity
        </Typography>
        <Button LinkComponent={Link} variant='text' href='/notifications' sx={{ fontWeight: 400, p: 0 }}>
          View All
        </Button>
      </Stack>
      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table aria-label='Recent activity table' size='small'>
          <TableBody>
            {[{}].map((row) => (
              <TableRow
                key={row.username || 'valentin'}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  '& .MuiTableCell-root': {
                    p: '6px',
                    borderBottom: '1px solid',
                    borderBottomColor: 'background.default'
                  }
                }}
              >
                <TableCell align='right'>
                  <Stack alignItems='flex-start' flexDirection='column' gap={1}>
                    <Typography variant='caption' component='p' noWrap maxWidth={{ xs: '150px', md: '100%' }}>
                      {row.message || 'Contribution accepted'}
                    </Typography>
                    <Stack alignItems='center' flexDirection='row' gap={0.5}>
                      {iconMap[row.type || 'contribution']}
                      <Typography variant='caption' component='p' noWrap sx={{ verticalAlign: 'center' }}>
                        {row.detail || '/charmverse'}
                      </Typography>
                    </Stack>
                  </Stack>
                </TableCell>
                {(row.bonus || row.gemsEarned) && (
                  <TableCell align='right'>
                    <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                      <Typography variant='caption' noWrap>
                        {row.gemsEarned || 0}
                      </Typography>
                      <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
                    </Stack>
                    <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                      <Typography variant='caption' noWrap>
                        {row.bonus || 0}
                      </Typography>
                      <Image width={15} height={15} src='/images/profile/icons/optimism-icon.svg' alt='Bonus' />
                    </Stack>
                  </TableCell>
                )}
                <TableCell align='right'>
                  <Typography variant='caption' noWrap>
                    {DateTime.fromISO(row.date || '2023-10-10T12:00:00Z')
                      .toRelative({
                        style: 'narrow',
                        locale: 'en',
                        round: true
                      })
                      ?.replace(' ago', '')}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
