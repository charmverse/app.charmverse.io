import { ScoutGameActivityType } from '@charmverse/core/prisma-client';
import DiamondIcon from '@mui/icons-material/Diamond';
import GavelIcon from '@mui/icons-material/Gavel';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { ListItem, ListItemText, Stack, Typography } from '@mui/material';
import type { ScoutGameNotification } from '@packages/scoutgame/notifications/getNotifications';
import { getRelativeTime } from '@packages/utils/dates';
import Link from 'next/link';
import type { ReactNode } from 'react';
import React from 'react';

export const iconMap: Record<ScoutGameActivityType, any> = {
  builder_strike: GavelIcon,
  builder_suspended: NotInterestedIcon,
  gems_first_pr: DiamondIcon,
  gems_regular_pr: DiamondIcon,
  gems_third_pr_in_streak: DiamondIcon,
  nft_purchase: ShoppingCartIcon,
  points: PointOfSaleIcon
};

export function mapActivityToRow(notification: ScoutGameNotification) {
  let title: ReactNode = '';
  let subtitle: ReactNode = '';

  switch (notification.type) {
    case ScoutGameActivityType.gems_first_pr:
    case ScoutGameActivityType.gems_regular_pr:
    case ScoutGameActivityType.gems_third_pr_in_streak:
      title =
        notification.recipientType === 'builder' ? (
          'Contribution accepted!'
        ) : (
          <>
            <Link href={`/u/${notification.builderUsername}`}>{notification.builderUsername}</Link> scored
          </>
        );
      subtitle =
        notification.recipientType === 'builder' ? (
          <Link href={`https://github.com/${notification.repo}/${notification.pullRequestNumber}`}>
            {notification.repo}
          </Link>
        ) : (
          ''
        );
      break;
    case ScoutGameActivityType.nft_purchase:
      title = (
        <>
          Scouted by{' '}
          <Link href={`/u/${notification.scoutUsername}`}>
            {notification.scoutUsername} (x{notification.tokensPurchased} NFTs)
          </Link>
        </>
      );
      subtitle = (
        <>{notification.pointsValue} Scout Points (20% of proceeds in scout points immediately added to balance)</>
      );
      break;
    case ScoutGameActivityType.points:
      title = `Congratulations! Your season ${notification.season} week ${notification.week} reward are ready to be claimed!`;
      subtitle = `${notification.amount} Scout Points`;
      break;
    case ScoutGameActivityType.builder_strike:
      title =
        notification.recipientType === 'builder' ? (
          <>
            PR rejected. Strike {notification.strikeCount} of 3
            <Link href={`https://github.com/${notification.repo}/${notification.pullRequestNumber}`}>
              {notification.repo}
            </Link>
          </>
        ) : (
          <>
            <Link href={`/u/${notification.builderUsername}`}>{notification.builderUsername}</Link>
            received strike {notification.strikeCount} of 3
          </>
        );
      break;
    case ScoutGameActivityType.builder_suspended:
      title =
        notification.recipientType === 'builder' ? (
          <>
            PR rejected. Strike 3 of 3. Suspended
            <Link href={`https://github.com/${notification.repo}/${notification.pullRequestNumber}`}>
              {notification.repo}
            </Link>
          </>
        ) : (
          <>
            <Link href={`/u/${notification.builderUsername}`}>{notification.builderUsername}</Link>
            is suspended
          </>
        );
      break;
    default:
      throw new Error();
  }

  return {
    title,
    subtitle
  };
}

export function NotificationRow({ notification }: { notification: ScoutGameNotification }) {
  const { subtitle, title } = mapActivityToRow(notification);

  const { amount, createdAt } = notification;

  const time = getRelativeTime(createdAt);
  const Icon = iconMap[notification.type];
  return (
    <ListItem sx={{ bgcolor: 'background.paper', mb: '2px' }}>
      <ListItemText
        primary={
          <Stack flexDirection='row' alignItems='center' gap={1}>
            <Icon sx={{ fontSize: '12px' }} />
            <Typography variant='body1' fontSize={{ xs: '12px', md: '14px' }}>
              {title}
            </Typography>
          </Stack>
        }
        secondary={
          <Typography variant='body2' display='flex' alignItems='center' gap={0.5}>
            {' '}
            {subtitle}
          </Typography>
        }
      />
      <Typography variant='body1' fontSize={{ xs: '12px', md: '14px' }} style={{ color: 'white' }}>
        {amount}
      </Typography>
      <Typography sx={{ width: '100px' }} fontSize={{ xs: '12px', md: '14px' }} align='center' variant='body2'>
        {getRelativeTime(createdAt)}
      </Typography>
    </ListItem>
  );
}
