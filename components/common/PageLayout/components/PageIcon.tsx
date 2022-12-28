import styled from '@emotion/styled';
import FilledPageIcon from '@mui/icons-material/DescriptionOutlined';
import EmptyPageIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ArrowOutwardIcon from '@mui/icons-material/NorthEast';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import DatabaseIcon from '@mui/icons-material/TableChart';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
import { Box } from '@mui/material';
import type { Page } from '@prisma/client';
import type { ComponentProps, ReactNode } from 'react';

import EmojiIcon from 'components/common/Emoji';
import { greyColor2 } from 'theme/colors';

export const StyledDatabaseIcon = styled(DatabaseIcon)`
  color: ${greyColor2};
  opacity: 0.5;
  font-size: 22px;
`;

const StyledPageIcon = styled(EmojiIcon)`
  height: 24px;
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
  pageType?: Page['type'];
  isEditorEmpty?: boolean;
};

export function PageIcon({ icon, isEditorEmpty, pageType, ...props }: PageIconProps) {
  if (!icon) {
    if (pageType === 'linked_board') {
      icon = (
        <LinkedIcon>
          <StyledDatabaseIcon />
        </LinkedIcon>
      );
    } else if (pageType === 'board' || pageType === 'inline_board' || pageType === 'inline_linked_board') {
      icon = <StyledDatabaseIcon />;
    } else if (pageType === 'proposal') {
      icon = <ProposalIcon />;
    } else if (pageType === 'bounty') {
      icon = <BountyIcon />;
    } else if (isEditorEmpty) {
      icon = <EmptyPageIcon />;
    } else {
      icon = <FilledPageIcon />;
    }
  }
  return <StyledPageIcon icon={icon} {...props} />;
}
