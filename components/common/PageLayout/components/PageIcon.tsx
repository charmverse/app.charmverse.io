import styled from '@emotion/styled';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FilledPageIcon from '@mui/icons-material/DescriptionOutlined';
import EmptyPageIcon from '@mui/icons-material/InsertDriveFileOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import ArrowOutwardIcon from '@mui/icons-material/NorthEast';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import DatabaseIcon from '@mui/icons-material/TableChart';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box } from '@mui/material';
import type { ComponentProps, ReactNode } from 'react';

import type { AllPagesProp } from 'components/common/CharmEditor/components/PageList';
import EmojiIcon from 'components/common/Emoji';
import { greyColor2 } from 'theme/colors';

export const StyledDatabaseIcon = styled(DatabaseIcon)`
  color: ${greyColor2};
  opacity: 0.5;
  font-size: 22px;
`;

export const StyledPageIcon = styled(EmojiIcon)`
  height: 24px;
  z-index: 0;
  width: 24px;
  margin-right: 4px;
  color: ${({ theme }) => theme.palette.secondary.light};
  &::before {
    // fixes vertical layout for svg icons
    content: '\\200B';
  }
  // style focalboard icons;
  .Icon {
    height: 22px;
    width: 22px;
  }
`;

export const StyledLinkIcon = styled(ArrowOutwardIcon)`
  position: absolute;
  bottom: 2px;
  right: -1px;
  color: var(--text-gray);
  font-size: 12px;
  stroke: var(--background-light);
  stroke-width: 5px;
  paint-order: stroke;
`;

export function LinkedIcon({ children }: { children: ReactNode }) {
  return (
    <Box display='flex' alignItems='center' justifyContent='center'>
      {children}
      <StyledLinkIcon className='styled-link-icon' />
    </Box>
  );
}

type PageIconProps = Omit<ComponentProps<typeof StyledPageIcon>, 'icon'> & {
  icon?: ReactNode | null | 'application';
  pageType?: AllPagesProp['type'];
  isEditorEmpty?: boolean;
  isLinkedPage?: boolean;
};

export function NoAccessPageIcon() {
  return (
    <StyledPageIcon
      icon={
        <LinkedIcon>
          <VisibilityOffIcon />
        </LinkedIcon>
      }
    />
  );
}
export function PageIcon({ icon, isEditorEmpty, isLinkedPage = false, pageType, ...props }: PageIconProps) {
  let iconComponent: ReactNode = icon;
  if (!icon) {
    if (pageType === 'linked_board') {
      return (
        <StyledPageIcon
          icon={
            <LinkedIcon>
              <StyledDatabaseIcon />
            </LinkedIcon>
          }
          {...props}
        />
      );
    } else if (pageType === 'board' || pageType === 'inline_board' || pageType === 'inline_linked_board') {
      iconComponent = <StyledDatabaseIcon />;
    } else if (pageType === 'proposal' || pageType === 'proposals') {
      iconComponent = <ProposalIcon />;
    } else if (pageType === 'bounty' || pageType === 'bounties') {
      iconComponent = <BountyIcon />;
    } else if (pageType === 'members') {
      iconComponent = <AccountCircleIcon />;
    } else if (pageType === 'forum' || pageType === 'forum_category') {
      iconComponent = <MessageOutlinedIcon />;
    } else if (isEditorEmpty) {
      iconComponent = <EmptyPageIcon />;
    } else {
      iconComponent = <FilledPageIcon />;
    }
  } else if (typeof icon === 'string' && icon.startsWith('http')) {
    iconComponent = (
      <img
        src={icon}
        style={{
          objectFit: 'cover'
        }}
      />
    );
  }

  return isLinkedPage ? (
    <StyledPageIcon icon={<LinkedIcon>{iconComponent}</LinkedIcon>} {...props} />
  ) : (
    <StyledPageIcon icon={iconComponent} {...props} />
  );
}
