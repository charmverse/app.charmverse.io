import { Stack, TableHead, Typography } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import type { BonusPartner } from '@packages/scoutgame/bonus';
import { bonusPartnersRecord } from '@packages/scoutgame/bonus';
import type { BuilderActivity } from '@packages/scoutgame/builders/getBuilderActivities';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { GemsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import {
  BuilderActivityGems,
  getActivityLabel
} from '@packages/scoutgame-ui/components/profile/components/BuilderProfile/BuilderActivitiesList';
import { secondaryTextColorDarkMode } from '@packages/scoutgame-ui/theme/colors.ts';
import { getRelativeTime } from '@packages/utils/dates';
import Image from 'next/image';
import Link from 'next/link';
import { BiLike } from 'react-icons/bi';
import { LuBookMarked } from 'react-icons/lu';

import { CommonTableRow } from './CommonTableRow';
import { TableCellText } from './TableCellText';

export function BuilderActivityAction({ activity }: { activity: BuilderActivity }) {
  return (
    <Stack component='span' spacing={0.5} width='100%'>
      <Stack direction='row' spacing={0.5} alignItems='center'>
        {activity.type === 'github_event' ? (
          activity.bonusPartner && bonusPartnersRecord[activity.bonusPartner as BonusPartner] ? (
            <Image
              width={15}
              height={15}
              src={bonusPartnersRecord[activity.bonusPartner as BonusPartner].icon}
              alt='Bonus Partner'
              style={{ marginRight: '2px' }}
            />
          ) : (
            <LuBookMarked size='15px' style={{ flexShrink: 0, marginTop: '2.5px' }} />
          )
        ) : activity.type === 'nft_purchase' ? (
          <BiLike size='15px' style={{ flexShrink: 0, marginTop: '2.5px' }} />
        ) : null}
        <Stack flexDirection='row' gap={0.5} alignItems='center' justifyContent='space-between' width='100%'>
          <Hidden mdDown>
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
            </Typography>
          </Hidden>
          <Hidden mdUp>
            <Typography
              variant='body2'
              component='span'
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {getActivityLabel(activity, true)}
            </Typography>
          </Hidden>
          <BuilderActivityGems activity={activity} size='small' />
        </Stack>
      </Stack>
      <Typography variant='caption' color={secondaryTextColorDarkMode}>
        {activity.type === 'nft_purchase' && (
          <Typography
            component='span'
            variant='caption'
            sx={{
              whiteSpace: 'nowrap',
              display: {
                xs: 'block',
                md: 'initial'
              }
            }}
          >
            <Link href={`/u/${activity.scout.path}`}>{activity.scout.displayName}</Link>
          </Typography>
        )}
        {activity.type === 'github_event' && (
          <Typography
            component='span'
            variant='caption'
            sx={{
              whiteSpace: 'nowrap',
              display: {
                xs: 'block',
                md: 'initial'
              }
            }}
          >
            <Link href={activity.url}>{activity.repo}</Link>
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
      sx={{ backgroundColor: 'background.paper' }}
      data-test='activity-table'
    >
      <TableHead
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          backgroundColor: 'background.paper'
        }}
      >
        <CommonTableRow>
          <TableCell>BUILDER</TableCell>
          <TableCell sx={{ '&.MuiTableCell-root': { pr: 0 } }}>
            <Stack direction='row' gap={0.5} alignItems='center' justifyContent='space-between'>
              <Typography variant='body2'>ACTION</Typography>
              <Stack display='inline-flex' flexDirection='row' gap={0.5} alignItems='center'>
                <Typography variant='body2' sx={{ display: { xs: 'none', md: 'initial' } }}>
                  EARNED
                </Typography>
                <GemsIcon />
              </Stack>
            </Stack>
          </TableCell>
          <TableCell />
        </CommonTableRow>
      </TableHead>
      <TableBody>
        {activities.map((activity) => {
          const relativeTime = getRelativeTime(activity.createdAt)
            ?.replace(' days', 'd')
            ?.replace(' day', 'd')
            ?.replace(' hrs.', 'h')
            ?.replace(' hr.', 'h')
            ?.replace(' min.', 'm')
            ?.replace(' sec.', 's');

          return (
            <CommonTableRow key={activity.id}>
              <TableCell
                scope='activity'
                sx={{
                  maxWidth: {
                    xs: 125,
                    md: 150
                  }
                }}
              >
                <Stack component={Link} href={`/u/${activity.path}`} alignItems='center' flexDirection='row' gap={1}>
                  <Avatar src={activity.avatar} name={activity.displayName} size='small' />
                  <TableCellText noWrap>{activity.displayName}</TableCellText>
                </Stack>
              </TableCell>
              <TableCell
                sx={{
                  maxWidth: { xs: '150px', md: '210px' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                <Stack direction='row' gap={0.5} alignItems='flex-start' justifyContent='space-between'>
                  <BuilderActivityAction activity={activity} />
                </Stack>
              </TableCell>
              <TableCell align='right' sx={{ maxWidth: 75, display: 'flex' }}>
                {relativeTime}
              </TableCell>
            </CommonTableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
