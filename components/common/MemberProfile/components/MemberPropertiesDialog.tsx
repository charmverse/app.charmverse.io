import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { DialogContent, useMediaQuery } from '@mui/material';
import type { ReactNode } from 'react';

import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import { DialogTitle } from 'components/common/Modal';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { useMembers } from 'hooks/useMembers';

const ContentContainer = styled(Container)`
  margin-bottom: 0;
`;

const StyledDialog = styled(Dialog)`
  .dialog {
    width: auto;
    height: auto;
  }
`;

export function MemberPropertiesDialog({
  children,
  spaceId,
  onClose,
  title
}: {
  spaceId: string | null;
  onClose: VoidFunction;
  title: string;
  children?: ReactNode;
}) {
  const theme = useTheme();
  const fullWidth = useMediaQuery(theme.breakpoints.down('md'));
  const { mutateMembers } = useMembers();

  function onClickClose() {
    // refresh members only after all the editing is finished
    onClose();
    mutateMembers();
  }

  if (!spaceId) {
    return null;
  }

  return (
    <StyledDialog onClose={onClickClose}>
      <ScrollableWindow>
        <ContentContainer fullWidth={fullWidth}>
          <DialogTitle sx={{ '&&': { px: 2, py: 2 } }} onClose={onClickClose}>
            {title}
          </DialogTitle>
          <DialogContent dividers sx={{ pb: 6 }}>
            {children}
          </DialogContent>
        </ContentContainer>
      </ScrollableWindow>
    </StyledDialog>
  );
}
