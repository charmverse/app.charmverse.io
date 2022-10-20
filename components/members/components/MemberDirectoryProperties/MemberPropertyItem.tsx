import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import LinkIcon from '@mui/icons-material/Link';
import ListIcon from '@mui/icons-material/List';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import NumbersIcon from '@mui/icons-material/Numbers';
import PhoneIcon from '@mui/icons-material/Phone';
import SubjectIcon from '@mui/icons-material/Subject';
import TextIcon from '@mui/icons-material/TextFields';
import TwitterIcon from '@mui/icons-material/Twitter';
import { ListItemIcon, ListItemText } from '@mui/material';
import type { MemberPropertyType } from '@prisma/client';
import type { ReactNode } from 'react';

import { MEMBER_PROPERTY_LABELS } from 'lib/members/constants';
import DiscordIcon from 'public/images/discord_logo.svg';

export const MemberPropertyIcons: Record<MemberPropertyType, ReactNode> = {
  text: <TextIcon fontSize='small' />,
  text_multiline: <SubjectIcon fontSize='small' />,
  number: <NumbersIcon fontSize='small' />,
  phone: <PhoneIcon fontSize='small' />,
  url: <LinkIcon fontSize='small' />,
  email: <AlternateEmailIcon fontSize='small' />,
  select: <FormatListBulletedIcon fontSize='small' />,
  multiselect: <ListIcon fontSize='small' />,
  role: <MilitaryTechIcon fontSize='small' />,
  profile_pic: <InsertPhotoIcon fontSize='small' />,
  timezone: <AccessTimeIcon fontSize='small' />,
  discord: <DiscordIcon width={18.5} height={18.5} />,
  twitter: <TwitterIcon fontSize='small' />,
  name: <DriveFileRenameOutlineIcon fontSize='small' />
};

export function MemberPropertyItem ({
  type,
  name
}: {
  type: MemberPropertyType;
  name?: string;
}) {
  return (
    <>
      <ListItemIcon>
        {MemberPropertyIcons[type]}
      </ListItemIcon>
      <ListItemText
        sx={{
          '& span': {
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }
        }}
      >
        {name ?? MEMBER_PROPERTY_LABELS[type]}
      </ListItemText>
    </>
  );
}
