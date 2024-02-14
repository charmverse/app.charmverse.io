import { Box } from '@mui/material';
import type { MouseEvent } from 'react';

import { useGetOrCreateProposalNotesId } from 'charmClient/hooks/proposals';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import {
  StyledLink,
  StyledTypography
} from 'components/common/CharmEditor/components/nestedPage/components/NestedPage';
import Link from 'components/common/Link';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageIcon } from 'components/common/PageIcon';
import { useSnackbar } from 'hooks/useSnackbar';

export function ProposalNotesLink({ proposalId }: { proposalId?: string }) {
  const { showPage } = usePageDialog();
  const { showError } = useSnackbar();
  const { trigger: getPageId } = useGetOrCreateProposalNotesId({ proposalId });

  async function onClickInternalLink(e: MouseEvent<HTMLAnchorElement>) {
    try {
      const result = await getPageId();
      if (result?.pageId) {
        showPage({ pageId: result.pageId });
        e.preventDefault();
      }
    } catch (error) {
      showError(error, 'Failed to load notes');
    }
  }

  return (
    <Box className='octo-propertyrow' mb='0 !important' pr={2} display='flex' justifyContent='space-between'>
      <PropertyLabel readOnly highlighted>
        Reviewer notes
      </PropertyLabel>
      <StyledLink onClick={onClickInternalLink}>
        <PageIcon pageType='page' />
        <StyledTypography>Notes</StyledTypography>
      </StyledLink>
    </Box>
  );
}
