import styled from '@emotion/styled';
import FilledPageIcon from '@mui/icons-material/DescriptionOutlined';
import EmptyPageIcon from '@mui/icons-material/InsertDriveFileOutlined';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import DatabaseIcon from '@mui/icons-material/TableChart';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
import type { Page } from '@prisma/client';
import type { ReactNode } from 'react';

import EmojiIcon from 'components/common/Emoji';
import { greyColor2 } from 'theme/colors';

export const StyledDatabaseIcon = styled(DatabaseIcon)`
  color: ${greyColor2};
  opacity: 0.5;
  font-size: 22px;
`;

export const StyledPageIcon = styled(EmojiIcon)`
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

export default function PageIcon ({ icon, isEditorEmpty, pageType }: { icon?: ReactNode, pageType: Page['type'], isEditorEmpty: boolean }) {
  if (icon) {
    return <StyledPageIcon icon={icon} />;
  }
  if (pageType === 'board' || pageType === 'inline_board') {
    return <StyledPageIcon icon={<StyledDatabaseIcon />} />;
  }
  else if (pageType === 'proposal') {
    return <StyledPageIcon icon={<ProposalIcon />} />;
  }
  else if (pageType === 'bounty') {
    return <StyledPageIcon icon={<BountyIcon />} />;
  }
  else if (isEditorEmpty) {
    return <StyledPageIcon icon={<EmptyPageIcon />} />;
  }
  else {
    return <StyledPageIcon icon={<FilledPageIcon />} />;
  }
}
