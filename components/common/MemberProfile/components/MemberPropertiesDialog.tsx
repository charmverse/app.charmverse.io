import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { DialogContent, useMediaQuery } from '@mui/material';
import type { ReactNode } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import LoadingComponent from 'components/common/LoadingComponent';
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
  memberId,
  spaceId,
  onClose,
  title,
  isLoading = false
}: {
  spaceId: string | null;
  memberId: string;
  onClose: VoidFunction;
  title: string;
  children?: ReactNode;
  isLoading?: boolean;
}) {
  const {
    data,
    mutate,
    isLoading: isFetchingSpaceProperties
  } = useSWR(
    spaceId ? `members/${memberId}/values/${spaceId}` : null,
    () => charmClient.members.getSpacePropertyValues(memberId, spaceId || ''),
    { revalidateOnMount: true }
  );

  const theme = useTheme();
  const fullWidth = useMediaQuery(theme.breakpoints.down('md'));
  const { mutateMembers } = useMembers();

  function onClickClose() {
    // refresh members only after all the editing is finished
    onClose();
    mutateMembers();
    mutate();
  }

  if (!spaceId) {
    return null;
  }

  return (
    <StyledDialog onClose={onClickClose}>
      <ScrollableWindow>
        <ContentContainer fullWidth={fullWidth}>
          {!data || isFetchingSpaceProperties || isLoading ? (
            <DialogContent>
              <LoadingComponent isLoading />
            </DialogContent>
          ) : (
            <>
              <DialogTitle sx={{ '&&': { px: 2, py: 2 } }} onClose={onClickClose}>
                {title}
              </DialogTitle>
              <DialogContent dividers sx={{ pb: 6 }}>
                {children}
              </DialogContent>
            </>
          )}
        </ContentContainer>
      </ScrollableWindow>
    </StyledDialog>
  );
}
