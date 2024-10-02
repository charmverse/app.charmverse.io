import 'server-only';

import { Box, Stack, TableHead } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import { getRelativeTime } from '@packages/utils/dates';
import Link from 'next/link';

import { Avatar } from 'components/common/Avatar';
import { GemsIcon } from 'components/common/Icons';
import {
  BuilderActivityBonusPartner,
  BuilderActivityDetail,
  BuilderActivityGems,
  getActivityLabel
} from 'components/profile/components/BuilderProfile/BuilderActivitiesList';
import type { BuilderActivity } from 'lib/builders/getBuilderActivities';

import { TableCellText } from './TableCellText';

export async function ActivityTable({ activities }: { activities: BuilderActivity[] }) {
  return (
    <TableContainer data-test='activity-table' component={Paper} sx={{ px: { md: 6 } }}>
      <Table aria-label='Activity table' size='small'>
        <TableHead sx={{ display: { xs: 'none', md: 'table-header-group' } }}>
          <TableRow
            sx={{
              [`& .${tableCellClasses.root}`]: {
                borderBottom: 'none',
                paddingLeft: '6px',
                paddingRight: '6px'
              }
            }}
          >
            <TableCell />
            <TableCell>ACTION</TableCell>
            <TableCell width='100px'>DETAIL</TableCell>
            <TableCell align='right'>
              <Stack display='inline-flex' flexDirection='row' gap={0.5} alignItems='center'>
                EARNED <GemsIcon />
              </Stack>
            </TableCell>
            <TableCell align='center'>BONUS</TableCell>
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
                <Stack
                  component={Link}
                  href={`/u/${activity.username}`}
                  alignItems='center'
                  flexDirection='row'
                  gap={1}
                >
                  <Avatar src={activity.avatar} name={activity.username} size='small' />
                  <TableCellText maxWidth={{ xs: '100px', md: '100%' }}>{activity.username}</TableCellText>
                </Stack>
              </TableCell>
              <TableCell>
                <TableCellText>{getActivityLabel(activity)}</TableCellText>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <TableCellText>
                  <BuilderActivityDetail activity={activity} />
                </TableCellText>
              </TableCell>
              <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <TableCellText display='inline-flex'>
                  <BuilderActivityGems activity={activity} showEmpty />
                </TableCellText>
              </TableCell>
              <TableCell align='center'>
                <BuilderActivityBonusPartner activity={activity} />
              </TableCell>
              <TableCell align='right'>
                <TableCellText>{getRelativeTime(activity.createdAt)}</TableCellText>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
