import { Stack, TableHead, Typography } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import type { BuilderActivity } from '@packages/scoutgame/builders/getBuilderActivities';
import { getRelativeTime } from '@packages/utils/dates';
import Link from 'next/link';
import { BiLike } from 'react-icons/bi';
import { LuBookMarked } from 'react-icons/lu';

import { Avatar } from 'components/common/Avatar';
import { GemsIcon } from 'components/common/Icons';
import {
  BuilderActivityBonusPartner,
  BuilderActivityGems,
  getActivityLabel
} from 'components/profile/components/BuilderProfile/BuilderActivitiesList';

import { TableCellText } from './TableCellText';

export function BuilderActivityAction({ activity }: { activity: BuilderActivity }) {
  return (
    <Stack component='span' direction='row' spacing={0.5} alignItems='flex-start'>
      {activity.type === 'github_event' ? (
        <LuBookMarked size='15px' style={{ flexShrink: 0, marginTop: '2.5px' }} />
      ) : activity.type === 'nft_purchase' ? (
        <BiLike size='15px' style={{ flexShrink: 0, marginTop: '2.5px' }} />
      ) : null}
      <Typography
        variant='body2'
        component='span'
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {getActivityLabel(activity)}
        {activity.type === 'nft_purchase' && (
          <Typography
            component='span'
            variant='caption'
            sx={{
              whiteSpace: 'nowrap',
              marginLeft: {
                xs: -0.5,
                md: '4px'
              },
              display: {
                xs: 'block',
                md: 'initial'
              }
            }}
          >
            <Link href={`/u/${activity.scout.path}`} style={{ marginLeft: '4px' }}>
              {activity.scout.displayName}
            </Link>
          </Typography>
        )}
        {activity.type === 'github_event' && (
          <Typography
            component='span'
            variant='caption'
            sx={{
              whiteSpace: 'nowrap',
              marginLeft: {
                xs: -0.15,
                md: '4px'
              },
              display: {
                xs: 'block',
                md: 'initial'
              }
            }}
          >
            <Link href={activity.url}>({activity.repo})</Link>
          </Typography>
        )}
      </Typography>
    </Stack>
  );
}

export function ActivityTable({ activities }: { activities: BuilderActivity[] }) {
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
            <TableCell>BUILDER</TableCell>
            <TableCell>ACTION</TableCell>
            <TableCell align='right'>
              <Stack display='inline-flex' flexDirection='row' gap={0.5} alignItems='center'>
                EARNED <GemsIcon />
              </Stack>
            </TableCell>
            <TableCell align='center'>BONUS</TableCell>
            <TableCell
              sx={{
                display: { xs: 'none', md: 'table-cell' }
              }}
            />
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
                  href={`/u/${activity.path}`}
                  alignItems='center'
                  flexDirection='row'
                  gap={1}
                  maxWidth={{ xs: '120px', md: 'initial' }}
                >
                  <Avatar src={activity.avatar} name={activity.displayName} size='small' />
                  <TableCellText noWrap>{activity.displayName}</TableCellText>
                </Stack>
              </TableCell>
              <TableCell
                sx={{
                  maxWidth: { xs: '150px', md: 'initial' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                <BuilderActivityAction activity={activity} />
              </TableCell>
              <TableCell align='right'>
                <TableCellText display='inline-flex'>
                  <BuilderActivityGems activity={activity} showEmpty />
                </TableCellText>
              </TableCell>
              <TableCell align='center'>
                <BuilderActivityBonusPartner activity={activity} />
              </TableCell>
              <TableCell
                align='right'
                sx={{
                  display: { xs: 'none', md: 'table-cell' }
                }}
              >
                <TableCellText>{getRelativeTime(activity.createdAt)}</TableCellText>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
