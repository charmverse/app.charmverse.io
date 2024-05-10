import type { PageType } from '@charmverse/core/prisma';
import { Box } from '@mui/material';
import { useFormContext } from 'react-hook-form';

import { usePublishProposal } from 'charmClient/hooks/proposals';
import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { FieldAnswerInput } from 'lib/forms/interfaces';
import type { ProjectAndMembersPayload, ProjectWithMembers } from 'lib/projects/interfaces';
import { getProposalErrors } from 'lib/proposals/getProposalErrors';
import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';

export function ProposalStickyFooter({
  proposal,
  formAnswers,
  page,
  isStructuredProposal,
  hasProjectField
}: {
  proposal: ProposalWithUsersAndRubric;
  formAnswers: FieldAnswerInput[];
  page: { title: string; hasContent?: boolean; sourceTemplateId: string | null; type: PageType };
  isStructuredProposal: boolean;
  hasProjectField: boolean;
}) {
  const projectForm = useFormContext<ProjectAndMembersPayload>();
  const projectFormValues = projectForm.watch() as ProjectWithMembers;

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
      hasContent: page.hasContent,
      title: page.title,
      type: page.type
    },
    project: hasProjectField ? projectFormValues : null,
    requireMilestone: milestoneFormInput?.required,
    isDraft: false, // isDraft skips all errors
    contentType: isStructuredProposal ? 'structured' : 'free_form',
    proposal: {
      ...proposal,
      formAnswers,
      formFields: proposal.form?.formFields || undefined,
      authors: proposal.authors.map((a) => a.userId)
    },
    requireTemplates: !!space?.requireProposalTemplate
  }).join('\n');

  return (
    <StickyFooterContainer>
      <Box display='flex' justifyContent='flex-end' alignItems='center' width='100%'>
        <Button
          disabledTooltip={disabledTooltip}
          disabled={!!disabledTooltip}
          data-test='publish-proposal-button'
          loading={isMutating}
          onClick={onClick}
        >
          Publish
        </Button>
      </Box>
    </StickyFooterContainer>
  );
}
