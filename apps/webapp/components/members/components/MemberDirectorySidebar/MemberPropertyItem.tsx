import type { MemberPropertyType } from '@charmverse/core/prisma';
import GithubIcon from '@mui/icons-material/GitHub';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import PersonIcon from '@mui/icons-material/Person';
import TextIcon from '@mui/icons-material/TextFields';
import { ListItemIcon, ListItemText, SvgIcon } from '@mui/material';
import type { ReactNode } from 'react';
import { FaGoogle, FaTelegramPlane, FaWallet } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

import { iconForPropertyType } from 'components/common/DatabaseEditor/widgets/iconForPropertyType';
import { UpgradeChip } from 'components/settings/subscription/UpgradeWrapper';
import { MEMBER_PROPERTY_CONFIG, PREMIUM_MEMBER_PROPERTIES } from '@packages/lib/members/constants';
import DiscordIcon from 'public/images/logos/discord_logo.svg';
import FarcasterLogo from 'public/images/logos/farcaster.svg';

export const MemberPropertyIcons: Record<MemberPropertyType, ReactNode> = {
  text: <TextIcon fontSize='small' />,
  text_multiline: iconForPropertyType('text'),
  number: iconForPropertyType('number'),
  phone: iconForPropertyType('phone'),
  url: iconForPropertyType('url'),
  email: iconForPropertyType('email'),
  select: iconForPropertyType('select'),
  multiselect: iconForPropertyType('multiSelect'),
  role: <MilitaryTechIcon fontSize='small' />,
  profile_pic: <InsertPhotoIcon fontSize='small' />,
  timezone: iconForPropertyType('updatedTime'),
  discord: <DiscordIcon width={18.5} height={18.5} />,
  twitter: <FaXTwitter width={18.5} height={18.5} />,
  linked_in: <LinkedInIcon width={18.5} height={18.5} />,
  github: <GithubIcon fontSize='small' />,
  bio: <PersonIcon fontSize='small' />,
  join_date: iconForPropertyType('date'),
  google: <FaGoogle fontSize='small' />,
  telegram: <FaTelegramPlane fontSize='small' />,
  wallet: <FaWallet fontSize='small' />,
  farcaster: (
    <SvgIcon viewBox='0 0 20 20' fontSize='small'>
      <FarcasterLogo />
    </SvgIcon>
  )
};

type Props = {
  type: MemberPropertyType;
  name?: string;
};
export function MemberPropertyItem({ type, name }: Props) {
  return (
    <>
      <ListItemIcon>{MemberPropertyIcons[type]}</ListItemIcon>
      <ListItemText
        sx={{
          '& span': {
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        {name ?? MEMBER_PROPERTY_CONFIG[type]?.label}
        {PREMIUM_MEMBER_PROPERTIES.includes(type) && <UpgradeChip upgradeContext='custom_roles' />}
      </ListItemText>
    </>
  );
}
