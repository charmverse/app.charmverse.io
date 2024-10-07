import { ScoutGameActivityType } from '@charmverse/core/prisma-client';
import DiamondIcon from '@mui/icons-material/Diamond';
import GavelIcon from '@mui/icons-material/Gavel';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Button, Stack, Typography } from '@mui/material';
import type { ScoutGameNotification } from '@packages/scoutgame/notifications/getNotifications';
import { getRelativeTime } from '@packages/utils/dates';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import React from 'react';

import { BonusPartnersDisplay } from 'components/profile/components/PointsClaimScreen/BonusPartnersDisplay';

export const iconMap: Record<ScoutGameActivityType, any> = {
  builder_strike: GavelIcon,
  builder_suspended: NotInterestedIcon,
  gems_first_pr: DiamondIcon,
  gems_regular_pr: DiamondIcon,
  gems_third_pr_in_streak: DiamondIcon,
  nft_purchase: ShoppingCartIcon,
  points: PointOfSaleIcon,
  daily_commit: DiamondIcon
};

function LinkText({ href, text }: { href: string; text: string | ReactNode }) {
  return (
    <Link href={href}>
      <Typography
        color='secondary'
        component='span'
        sx={{
          fontSize: {
            xs: 14,

            md: 16
          }
        }}
      >
        {text}
      </Typography>
    </Link>
  );
}

export function mapActivityToRow(notification: ScoutGameNotification) {
  let title: ReactNode = null;
  let subtitle: ReactNode = null;
  let action: ReactNode = null;

  switch (notification.type) {
    case ScoutGameActivityType.gems_first_pr:
    case ScoutGameActivityType.gems_regular_pr:
    case ScoutGameActivityType.gems_third_pr_in_streak:
      title =
        notification.recipientType === 'builder'
          ? notification.type === 'gems_first_pr'
            ? 'First contribution!'
            : notification.type === 'gems_third_pr_in_streak'
            ? 'Contribution streak!'
            : 'Contribution accepted!'
          : 'Builder scored!';
      subtitle =
        notification.recipientType === 'builder' ? (
          <Stack flexDirection='row' gap={1} alignItems='center'>
            <Image width={15} height={15} src='/images/profile/icons/github-circle-icon.svg' alt='Github' />
            <LinkText
              href={`https://github.com/${notification.repo}/pull/${notification.pullRequestNumber}`}
              text={notification.repo}
            />
          </Stack>
        ) : (
          <LinkText href={`/u/${notification.builderUsername}`} text={notification.builderUsername} />
        );
      action = (
        <Stack gap={0.5} alignItems='flex-end'>
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center'>
            <Typography variant='body1'>{notification.amount || 0}</Typography>
            <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
          </Stack>
          {notification.bonus ? <BonusPartnersDisplay size={15} bonusPartners={[notification.bonus]} /> : null}
        </Stack>
      );
      break;
    case ScoutGameActivityType.nft_purchase:
      title = 'Scouted!';
      subtitle = (
        <Link href={`/u/${notification.scoutUsername}`}>
          <Typography
            color='secondary'
            component='span'
            sx={{
              fontSize: {
                xs: 14,
                md: 16
              }
            }}
          >
            {notification.scoutUsername}
          </Typography>{' '}
          (purchased x{notification.tokensPurchased} NFTs)
        </Link>
      );
      action = (
        <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center'>
          <Typography variant='body1'>{notification.pointsValue}</Typography>
          <Image width={15} height={15} src='/images/profile/scout-game-icon.svg' alt='Gem' />
        </Stack>
      );
      break;
    case ScoutGameActivityType.points: {
      title = `Congratulations! Your season ${notification.season} week ${notification.week} reward are ready!`;
      const button = (
        <Button size='medium' variant='outlined' disabled={!notification.claimable} color='secondary' sx={{ my: 1 }}>
          <Typography variant='caption' color={notification.claimable ? 'secondary' : ''}>
            {notification.claimable ? `Claim now` : `Claimed`}
          </Typography>
        </Button>
      );
      subtitle = notification.claimable ? <Link href='/profile?tab=win'>{button}</Link> : button;
      action = (
        <Stack gap={0.5} alignItems='flex-end'>
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center'>
            <Typography variant='body1'>{notification.amount || 0}</Typography>
            <Image width={15} height={15} src='/images/profile/scout-game-icon.svg' alt='Gem' />
          </Stack>
          {notification.bonus ? <BonusPartnersDisplay size={15} bonusPartners={[notification.bonus]} /> : null}
        </Stack>
      );
      break;
    }
    case ScoutGameActivityType.builder_strike:
      title = notification.recipientType === 'builder' ? 'PR rejected!' : 'Builder received strike';
      subtitle =
        notification.recipientType === 'builder' ? (
          <Stack flexDirection='row' gap={1} alignItems='center'>
            <Image width={15} height={15} src='/images/profile/icons/github-circle-icon.svg' alt='Github' />
            <LinkText
              href={`https://github.com/${notification.repo}/pull/${notification.pullRequestNumber}`}
              text={notification.repo}
            />{' '}
            (strike {notification.strikeCount} of 3)
          </Stack>
        ) : (
          <>
            <LinkText href={`/u/${notification.builderUsername}`} text={notification.builderUsername} /> (strike{' '}
            {notification.strikeCount} of 3)
          </>
        );
      break;
    case ScoutGameActivityType.builder_suspended:
      title = notification.recipientType === 'builder' ? 'Suspended' : 'Builder suspended!';
      subtitle =
        notification.recipientType === 'builder' ? (
          <Stack flexDirection='row' gap={1} alignItems='center'>
            <Image width={15} height={15} src='/images/profile/icons/github-circle-icon.svg' alt='Github' />
            <LinkText
              href={`https://github.com/${notification.repo}/pull/${notification.pullRequestNumber}`}
              text={notification.repo}
            />
          </Stack>
        ) : (
          <LinkText href={`/u/${notification.builderUsername}`} text={notification.builderUsername} />
        );
      break;
    default:
      throw new Error();
  }

  return {
    title,
    subtitle,
    action
  };
}

export function NotificationRow({ notification }: { notification: ScoutGameNotification }) {
  const { subtitle, title, action } = mapActivityToRow(notification);

  const { createdAt } = notification;

  const Icon = iconMap[notification.type];
  return (
    <Stack
      sx={{
        bgcolor: 'background.paper',
        justifyContent: 'space-between',
        mb: '2px',
        flexDirection: 'row',
        gap: 1.5,
        alignItems: 'center',
        px: {
          xs: 1,
          md: 2
        },
        py: {
          xs: 1,
          md: 1.5
        }
      }}
    >
      <Stack
        sx={{
          width: '90%'
        }}
      >
        <Stack flexDirection='row' alignItems='center' gap={1} mb={0.5}>
          <Icon
            sx={{
              fontSize: {
                xs: 14,
                md: 16
              }
            }}
          />
          <Typography variant='body1' fontSize={{ xs: '12px', md: '16px' }}>
            {title}
          </Typography>
        </Stack>
        <Typography
          sx={{
            fontSize: {
              xs: '12px',
              md: '14px'
            }
          }}
        >
          {subtitle}
        </Typography>
      </Stack>
      {action ?? <div />}
      <Typography sx={{ width: '50px' }} fontSize={{ xs: '12px', md: '14px' }} align='right' variant='body2'>
        {getRelativeTime(createdAt)}
      </Typography>
    </Stack>
  );
}
