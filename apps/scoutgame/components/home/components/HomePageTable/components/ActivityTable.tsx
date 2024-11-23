import { Stack, TableHead, Typography } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import type { BuilderActivity } from '@packages/scoutgame/builders/getBuilderActivities';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { GemsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import {
  BuilderActivityBonusPartner,
  BuilderActivityGems,
  getActivityLabel
} from '@packages/scoutgame-ui/components/profile/components/BuilderProfile/BuilderActivitiesList';
import { getRelativeTime } from '@packages/utils/dates';
import Link from 'next/link';
import { BiLike } from 'react-icons/bi';
import { LuBookMarked } from 'react-icons/lu';

import { CommonTableRow } from './CommonTableRow';
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
    <Table
      aria-label='Leaderboard table'
      size='small'
      sx={{ px: { md: 6 }, backgroundColor: 'background.paper' }}
      data-test='activity-table'
    >
      <TableHead
        sx={{
          position: 'sticky',
          top: 45,
          zIndex: 1000,
          backgroundColor: 'background.paper'
        }}
      >
        <CommonTableRow>
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
        </CommonTableRow>
      </TableHead>
      <TableBody>
        {activities.map((activity) => (
          <CommonTableRow key={activity.id}>
            <TableCell scope='activity'>
              <Stack
                component={Link}
                href={`/u/${activity.path}`}
                alignItems='center'
                flexDirection='row'
                gap={1}
                maxWidth={{ xs: '120px', md: '150px' }}
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
          </CommonTableRow>
        ))}
      </TableBody>
    </Table>
  );
}
