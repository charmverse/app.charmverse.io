import { ReactNode } from 'react';
import { Page } from '@prisma/client';
import styled from '@emotion/styled';
import DatabaseIcon from '@mui/icons-material/TableChart';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
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
  else if (isEditorEmpty) {
    return <StyledPageIcon icon={<InsertDriveFileOutlinedIcon />} />;
  }
  else {
    return <StyledPageIcon icon={<DescriptionOutlinedIcon />} />;
  }
}
