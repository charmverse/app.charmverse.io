import type { PageType } from '@charmverse/core/prisma';
import { Box } from '@mui/material';
import { useFormContext } from 'react-hook-form';

import { usePublishProposal } from 'charmClient/hooks/proposals';
import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ProjectAndMembersPayload } from 'lib/projects/interfaces';
import { getProposalErrors } from 'lib/proposals/getProposalErrors';
import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';

export function ProposalStickyFooter({
  proposal,
  page,
  isStructuredProposal
}: {
  proposal: ProposalWithUsersAndRubric;
  page: { title: string; content?: any; sourceTemplateId: string | null; type: PageType };
  isStructuredProposal: boolean;
}) {
  const projectForm = useFormContext<ProjectAndMembersPayload>();
  const projectField = proposal.form?.formFields?.find((field) => field.type === 'project_profile');

  const { showMessage } = useSnackbar();
  const { space } = useCurrentSpace();
  const { trigger: publishProposal, isMutating } = usePublishProposal({ proposalId: proposal.id });

  async function onClick() {
    try {
      await publishProposal();
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }
  const milestoneFormInput = proposal.form?.formFields?.find((field) => field.type === 'milestone');

  const disabledTooltip = getProposalErrors({
    page: {
      sourceTemplateId: page.sourceTemplateId,
      content: page.content,
      title: page.title,
      type: page.type
    },
    requireMilestone: milestoneFormInput?.required,
    isDraft: false, // isDraft skips all errors
    contentType: isStructuredProposal ? 'structured' : 'free_form',
    proposal: {
      ...proposal,
      formFields: proposal.form?.formFields || undefined,
      authors: proposal.authors.map((a) => a.userId)
    },
    requireTemplates: !!space?.requireProposalTemplate
  }).join('\n');

  const isProjectFormValid = projectField ? projectForm.formState.isValid : true;

  return (
    <StickyFooterContainer>
      <Box display='flex' justifyContent='flex-end' alignItems='center' width='100%'>
        <Button
          disabledTooltip={disabledTooltip || !isProjectFormValid ? 'Project fields are missing or invalid' : undefined}
          disabled={!!disabledTooltip || !isProjectFormValid}
          data-test='complete-draft-button'
          loading={isMutating}
          onClick={onClick}
        >
          Publish
        </Button>
      </Box>
    </StickyFooterContainer>
  );
}
