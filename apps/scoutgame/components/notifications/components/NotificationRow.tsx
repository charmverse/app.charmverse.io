// IndividualRow.js
import type { ScoutGameActivity } from '@charmverse/core/prisma-client';
import { PointsDirection, ScoutGameActivityType } from '@charmverse/core/prisma-client';
import DiamondIcon from '@mui/icons-material/Diamond';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarIcon from '@mui/icons-material/Star';
import { ListItem, ListItemText, ListItemIcon, Typography, Icon } from '@mui/material';
import { getRelativeTime } from '@packages/utils/dates';
// iconMap.ts

export const iconMap: Record<ScoutGameActivityType, any> = {
  strike: GavelIcon,
  mint: ShoppingCartIcon,
  gems: DiamondIcon, // Use StarIcon if DiamondIcon is not available
  points: PointOfSaleIcon,
  gems_from_pr: DiamondIcon, // Use StarIcon if DiamondIcon is not available
  builder_registered: PersonAddIcon
};

export function mapActivityToRow(activity: ScoutGameActivity) {
  let title = '';
  let subtitle = '';
  let icon: ScoutGameActivityType;

  switch (activity.type) {
    case ScoutGameActivityType.strike:
      title = 'Builder Strike';
      subtitle = `Strike ID: ${activity.builderStrikeId}`;
      icon = 'strike';
      break;
    case ScoutGameActivityType.mint:
      title = 'NFT Purchase';
      subtitle = `Purchase Event ID: ${activity.nftPurchaseEventId}`;
      icon = 'mint';
      break;
    case ScoutGameActivityType.gems:
      title = 'Gems Payout';
      subtitle = `Payout Event ID: ${activity.gemsPayoutEventId}`;
      icon = 'gems';
      break;
    case ScoutGameActivityType.points:
      title = 'Points Receipt';
      subtitle = `Points Receipt ID: ${activity.pointsReceiptId}`;
      icon = 'points';
      break;
    case ScoutGameActivityType.gems_from_pr:
      title = 'Gems Receipt';
      subtitle = `Gems Receipt ID: ${activity.gemsReceiptId}`;
      icon = 'gems_from_pr';
      break;
    case ScoutGameActivityType.builder_registered:
      title = 'Builder Registered';
      subtitle = `Registered Builder NFT ID: ${activity.registeredBuilderNftId}`;
      icon = 'builder_registered';
      break;
    default:
      throw new Error(`Unknown activity type: ${activity.type}`);
  }

  return {
    title,
    subtitle,
    icon
  };
}

export function NotificationRow({ activity }: { activity: ScoutGameActivity }) {
  const { icon, subtitle, title } = mapActivityToRow(activity);

  const { amount, pointsDirection, createdAt } = activity;
  const amountColor = pointsDirection === PointsDirection.in ? 'green' : 'red';

  const time = getRelativeTime(createdAt);

  const EventIcon = iconMap[icon];

  return (
    <ListItem sx={{ bgcolor: 'background.paper', mb: '2px' }}>
      <ListItemText
        primary={
          <Typography variant='body1' fontSize={{ xs: '12px', md: '14px' }}>
            {title}
          </Typography>
        }
        // secondary={
        //   <Typography variant='body2' display='flex' alignItems='center' gap={0.5}>
        //     {' '}
        //     <EventIcon sx={{ fontSize: '12px' }} />
        //     {subtitle}
        //   </Typography>
        // }
      />
      <Typography variant='body1' fontSize={{ xs: '12px', md: '14px' }} style={{ color: amountColor }}>
        {pointsDirection === 'in' ? `+${amount}` : `-${amount}`}
      </Typography>
      <Typography sx={{ width: '100px' }} fontSize={{ xs: '12px', md: '14px' }} align='center' variant='body2'>
        {time}
      </Typography>
    </ListItem>
  );
}
