import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { useMediaQuery } from '@mui/material';
import type { ReactNode } from 'react';

import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import Legend from 'components/settings/Legend';
import { useMembers } from 'hooks/useMembers';

const ContentContainer = styled(Container)``;

const StyledDialog = styled(Dialog)<{ fluidSize?: boolean }>`
  ${(props) =>
    props.fluidSize
      ? `.dialog {
          width: auto;
          height: auto;
        }`
      : ''}
`;

export function UserProfileDialog({
  children,
  onClose,
  title,
  fluidSize
}: {
  onClose: VoidFunction;
  title: string;
  children?: ReactNode;
  fluidSize?: boolean;
}) {
  const theme = useTheme();
  const fullWidth = useMediaQuery(theme.breakpoints.down('md'));
  const { mutateMembers } = useMembers();

  function onClickClose() {
    // refresh members only after all the editing is finished
    onClose();
    mutateMembers();
  }

  return (
    <StyledDialog toolbar={<div />} fluidSize={fluidSize} onClose={onClickClose}>
      <ScrollableWindow>
        <ContentContainer fullWidth={fullWidth} top={0}>
          <Legend>{title}</Legend>
          {children}
        </ContentContainer>
      </ScrollableWindow>
    </StyledDialog>
  );
}
