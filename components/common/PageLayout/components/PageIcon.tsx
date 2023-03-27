import styled from '@emotion/styled';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FilledPageIcon from '@mui/icons-material/DescriptionOutlined';
import EmptyPageIcon from '@mui/icons-material/InsertDriveFileOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import ArrowOutwardIcon from '@mui/icons-material/NorthEast';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import DatabaseIcon from '@mui/icons-material/TableChart';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
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

const StyledPageIcon = styled(EmojiIcon)`
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

const StyledLinkIcon = styled(ArrowOutwardIcon)`
  position: absolute;
  bottom: 2px;
  right: -1px;
  color: var(--text-gray);
  font-size: 12px;
  stroke: var(--background-light);
  stroke-width: 5px;
  paint-order: stroke;
`;

function LinkedIcon({ children }: { children: ReactNode }) {
  return (
    <Box display='flex' alignItems='center' justifyContent='center'>
      {children}
      <StyledLinkIcon />
    </Box>
  );
}

type PageIconProps = ComponentProps<typeof StyledPageIcon> & {
  icon?: ReactNode;
  pageType?: AllPagesProp['type'];
  isEditorEmpty?: boolean;
  isLinkedPage?: boolean;
};

export function PageIcon({ icon, isEditorEmpty, isLinkedPage = false, pageType, ...props }: PageIconProps) {
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
      icon = <StyledDatabaseIcon />;
    } else if (pageType === 'proposal' || pageType === 'proposals') {
      icon = <ProposalIcon />;
    } else if (pageType === 'bounty' || pageType === 'bounties') {
      icon = <BountyIcon />;
    } else if (pageType === 'members') {
      icon = <AccountCircleIcon />;
    } else if (pageType === 'forum' || pageType === 'forum_category') {
      icon = <MessageOutlinedIcon />;
    } else if (isEditorEmpty) {
      icon = <EmptyPageIcon />;
    } else {
      icon = <FilledPageIcon />;
    }
  }

  return isLinkedPage ? (
    <StyledPageIcon icon={<LinkedIcon>{icon}</LinkedIcon>} {...props} />
  ) : (
    <StyledPageIcon icon={icon} {...props} />
  );
}
