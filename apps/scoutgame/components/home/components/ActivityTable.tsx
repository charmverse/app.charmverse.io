import 'server-only';

import { Stack, TableHead, Typography } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import { getRelativeTime } from '@packages/utils/dates';

import {
  BuilderActivityDetail,
  BuilderActivityGems,
  BuilderActivityLabel
} from 'components/profile/components/BuilderActivitiesList';
import type { BuilderActivity } from 'lib/builders/getBuilderActivities';

import { Avatar } from '../../common/Avatar';

export async function ActivityTable({ activities }: { activities: BuilderActivity[] }) {
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table aria-label='Activity table' size='small'>
        <TableHead sx={{ display: { xs: 'none', md: 'table-header-group' } }}>
          <TableRow
            sx={{
              [`& .${tableCellClasses.root}`]: {
                borderBottom: 'none',
                paddingLeft: 0,
                paddingRight: 0
              }
            }}
          >
            <TableCell />
            <TableCell>ACTION</TableCell>
            <TableCell>DETAIL</TableCell>
            <TableCell align='right'>EARNED</TableCell>
            <TableCell align='right'>BONUS</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {activities.map((activity) => (
            <TableRow
              key={activity.id}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '& .MuiTableCell-root': { p: '6px', borderBottom: '1px solid', borderBottomColor: 'background.default' }
              }}
            >
              <TableCell component='th' scope='activity'>
                <Stack alignItems='center' flexDirection='row' gap={1}>
                  <Avatar src={activity.avatar} name={activity.username} size='small' />
                  <Typography variant='caption' noWrap maxWidth={{ xs: '70px', md: '100%' }}>
                    {activity.username}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align='right'>
                <Stack alignItems='center' flexDirection='row' gap={1}>
                  <BuilderActivityLabel activity={activity} />
                </Stack>
              </TableCell>
              <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <BuilderActivityDetail activity={activity} />
              </TableCell>
              <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Stack justifyContent='flex-end' flexDirection='row' gap={1}>
                  <BuilderActivityGems activity={activity} />
                </Stack>
              </TableCell>
              <TableCell align='right'>-</TableCell>
              <TableCell align='right'>
                <Typography variant='caption' noWrap>
                  {getRelativeTime(activity.createdAt)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
