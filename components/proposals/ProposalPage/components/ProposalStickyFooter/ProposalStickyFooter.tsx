import type { PageType } from '@charmverse/core/prisma';
import { Box } from '@mui/material';
import type { Control } from 'react-hook-form';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';

import { usePublishProposal } from 'charmClient/hooks/proposals';
import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { FormFieldValue } from 'lib/forms/interfaces';
import type { ProjectAndMembersPayload, ProjectWithMembers } from 'lib/projects/interfaces';
import type { ProposalToErrorCheck } from 'lib/proposals/getProposalErrors';
import { getProposalErrors } from 'lib/proposals/getProposalErrors';
import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';

export function ProposalStickyFooter({
  proposal,
  formAnswersControl,
  page,
  isStructuredProposal
}: {
  proposal: ProposalWithUsersAndRubric;
  formAnswersControl: Control<Record<string, FormFieldValue>, any>;
  page: { title: string; hasContent?: boolean; sourceTemplateId: string | null; type: PageType };
  isStructuredProposal: boolean;
}) {
  const projectForm = useFormContext<ProjectAndMembersPayload>();
  const projectFormValues = projectForm.watch() as ProjectWithMembers;
  const { isValid: isFormAnswersValid } = useFormState({ control: formAnswersControl });
  const answerFormValues = useWatch({ control: formAnswersControl });
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

  const projectProfileField = proposal?.form?.formFields?.find((field) => field.type === 'project_profile');
  const milestoneFormInput = proposal.form?.formFields?.find((field) => field.type === 'milestone');
  const formFields =
    page.type === 'proposal_template'
      ? proposal.form?.formFields
      : proposal.form?.formFields?.filter((field) => field.type === 'project_profile');
  const projectProfileAnswer = projectProfileField ? answerFormValues[projectProfileField.id] : null;
  const errors = getProposalErrors({
    page: {
      sourceTemplateId: page.sourceTemplateId,
      hasContent: page.hasContent,
      title: page.title,
      type: page.type
    },
    project: projectProfileField ? projectFormValues : null,
    requireMilestone: milestoneFormInput?.required,
    isDraft: false, // isDraft skips all errors
    contentType: isStructuredProposal ? 'structured' : 'free_form',
    proposal: {
      ...proposal,
      // form field answers are validated using react-hook-from, except for project profile
      formAnswers: projectProfileAnswer ? [{ fieldId: projectProfileField!.id, value: projectProfileAnswer }] : [],
      formFields,
      authors: proposal.authors.map((a) => a.userId)
    } as ProposalToErrorCheck,
    requireTemplates: !!space?.requireProposalTemplate
  });

  // use validation of react-hook-form for proposal answers
  if (proposal.form?.formFields && page.type === 'proposal' && !isFormAnswersValid) {
    errors.push('Form answers are not valid');
  }
  const disabledTooltip = errors.length > 0 ? errors.join('\n') : undefined;

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
