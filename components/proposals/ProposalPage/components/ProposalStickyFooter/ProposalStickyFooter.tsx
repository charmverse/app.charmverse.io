import type { PageType } from '@charmverse/core/prisma';
import { Box } from '@mui/material';
import type { FormFieldValue, FormFieldInput, TypedFormField } from '@root/lib/proposals/forms/interfaces';
import { delay } from '@root/lib/utils/async';
import { useState } from 'react';
import type { Control } from 'react-hook-form';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';

import charmClient from 'charmClient';
import { usePublishProposal } from 'charmClient/hooks/proposals';
import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ProjectAndMembersPayload, ProjectWithMembers } from 'lib/projects/interfaces';
import type { ProposalToErrorCheck } from 'lib/proposals/getProposalErrors';
import { getProposalErrors } from 'lib/proposals/getProposalErrors';
import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';

export function ProposalStickyFooter({
  proposal,
  formAnswersControl,
  formFields: allFormFields,
  page,
  isStructuredProposal
}: {
  proposal: ProposalWithUsersAndRubric;
  formAnswersControl: Control<Record<string, FormFieldValue>, any>;
  formFields?: FormFieldInput[];
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
  const [loadingSave, setLoadingSave] = useState(false);

  async function onClick() {
    try {
      if (space?.domain === 'op-grants' && proposal.page?.type === 'proposal') {
        charmClient.track.trackActionOp('click_proposal_submit_button', {
          proposalId: proposal.id
        });
      }
      await publishProposal();
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }
  const projectProfileField = proposal?.form?.formFields?.find((field) => field.type === 'project_profile');
  const formFields =
    page.type === 'proposal_template'
      ? allFormFields
      : allFormFields?.filter(
          (field) =>
            !(field as TypedFormField).isHiddenByDependency &&
            (field.type === 'project_profile' || field.type === 'milestone')
        );
  const projectProfileAnswer = projectProfileField ? answerFormValues[projectProfileField.id] : null;

  const errors = getProposalErrors({
    page: {
      sourceTemplateId: page.sourceTemplateId,
      hasContent: page.hasContent,
      title: page.title,
      type: page.type
    },
    project: projectProfileField ? projectFormValues : null,
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

  const handleSave = async () => {
    setLoadingSave(true);
    await delay(1000);
    setLoadingSave(false);
  };

  return (
    <StickyFooterContainer>
      <Box display='flex' justifyContent='flex-end' alignItems='center' width='100%'>
        {proposal.status === 'draft' ? (
          <Button
            disabledTooltip={disabledTooltip}
            disabled={!!disabledTooltip}
            data-test='publish-proposal-button'
            loading={isMutating}
            onClick={onClick}
          >
            Publish
          </Button>
        ) : (
          <Button
            disabledTooltip={disabledTooltip}
            disabled={loadingSave}
            data-test='save-proposal-button'
            loading={loadingSave}
            onClick={handleSave}
          >
            Save
          </Button>
        )}
      </Box>
    </StickyFooterContainer>
  );
}
