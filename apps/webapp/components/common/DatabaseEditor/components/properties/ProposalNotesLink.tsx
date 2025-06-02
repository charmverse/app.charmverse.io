import { styled } from '@mui/material';
import type { MouseEvent } from 'react';

import { useGetOrCreateProposalNotesId } from 'charmClient/hooks/proposals';
import { StyledTypography } from 'components/common/CharmEditor/components/nestedPage/components/NestedPage';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageIcon } from 'components/common/PageIcon';
import { useSnackbar } from 'hooks/useSnackbar';

const StyledPageLink = styled('div')`
  display: flex;
  width: 100%;
  overflow: hidden;
  svg {
    font-size: 20px;
  }
`;

const Typography = styled(StyledTypography)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function ProposalNotesLink({ pageId }: { pageId: string }) {
  const { showPage } = usePageDialog();
  const { showError } = useSnackbar();

  const { trigger: getNotesPageId } = useGetOrCreateProposalNotesId();

  async function onClickInternalLink(e: MouseEvent) {
    try {
      const result = await getNotesPageId({ pageId });
      if (result?.pageId) {
        showPage({ pageId: result.pageId });
        e.preventDefault();
      }
    } catch (error) {
      showError(error, 'Failed to load notes');
    }
  }

  return (
    <StyledPageLink onClick={onClickInternalLink}>
      <PageIcon pageType='page' />
      <Typography variant='caption'>Reviewer Notes</Typography>
    </StyledPageLink>
  );
}
