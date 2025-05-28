import type { Page } from '@charmverse/core/prisma';
import { styled } from '@mui/material';
import MembersIcon from '@mui/icons-material/AccountCircle';
import FilledPageIcon from '@mui/icons-material/DescriptionOutlined';
import EmptyPageIcon from '@mui/icons-material/InsertDriveFileOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import ArrowOutwardIcon from '@mui/icons-material/NorthEast';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import DatabaseIcon from '@mui/icons-material/TableChart';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import { Box } from '@mui/material';
import type { StaticPageType } from '@packages/features/constants';
import type { ComponentProps, ReactNode } from 'react';

import { greyColor2 } from 'theme/colors';

import EmojiIcon from './Emoji';

export const StyledDatabaseIcon = styled(DatabaseIcon)`
  color: ${greyColor2};
  opacity: 0.5;
  font-size: 22px;
`;

export const StyledPageIcon = styled(EmojiIcon)`
  height: 22px;
  z-index: 0;
  width: 22px;
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

export type PagePathType = Page['type'] | StaticPageType | 'forum_category';

type PageIconProps = Omit<ComponentProps<typeof StyledPageIcon>, 'icon'> & {
  icon?: ReactNode | null | 'application';
  pageType?: PagePathType;
  isEditorEmpty?: boolean;
  isLinkedPage?: boolean;
  isStructuredProposal?: boolean;
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

export function PageIcon({
  isStructuredProposal = false,
  icon,
  isEditorEmpty,
  isLinkedPage = false,
  pageType,
  ...props
}: PageIconProps) {
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
    } else if (pageType === 'proposal' || pageType === 'proposal_template' || pageType === 'proposals') {
      iconComponent = <ProposalIcon />;
    } else if (pageType === 'rewards' || pageType === 'bounty') {
      iconComponent = <BountyIcon />;
    } else if (pageType === 'members') {
      iconComponent = <MembersIcon />;
    } else if (pageType === 'forum' || pageType === 'forum_category') {
      iconComponent = <MessageOutlinedIcon />;
    } else if (isStructuredProposal) {
      iconComponent = <WidgetsOutlinedIcon />;
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

export { MembersIcon, ProposalIcon };
