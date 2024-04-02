import type { PageType } from '@charmverse/core/prisma';
import { Box } from '@mui/material';
import { useFormContext } from 'react-hook-form';

import { useCreateProject, useGetProjects } from 'charmClient/hooks/projects';
import {
  useGetProposalFormFieldAnswers,
  usePublishProposal,
  useUpdateProposalFormFieldAnswers
} from 'charmClient/hooks/proposals';
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
  refreshProposal,
  isStructuredProposal
}: {
  proposal: ProposalWithUsersAndRubric;
  page: { title: string; content?: any; sourceTemplateId: string | null; type: PageType };
  refreshProposal: VoidFunction;
  isStructuredProposal: boolean;
}) {
  const projectForm = useFormContext<ProjectAndMembersPayload>();
  const projectField = proposal.form?.formFields?.find((field) => field.type === 'project_profile');
  const { trigger } = useUpdateProposalFormFieldAnswers({ proposalId: proposal.id });
  const { data: proposalFormFieldAnswers = [] } = useGetProposalFormFieldAnswers({
    proposalId: proposal.id
  });
  const { mutate } = useGetProjects();
  const projectFormFieldAnswer = proposalFormFieldAnswers.find(
    (proposalFormFieldAnswer) => proposalFormFieldAnswer.fieldId === projectField?.id
  );
  const currentProjectId = (projectFormFieldAnswer?.value as { projectId: string })?.projectId;
  const { trigger: createProject } = useCreateProject();
  const { showMessage } = useSnackbar();
  const { space } = useCurrentSpace();
  const { trigger: publishProposal, isMutating } = usePublishProposal({ proposalId: proposal.id });

  async function onClick() {
    try {
      // Before publishing the proposal, we need to create the project if it doesn't exist
      // And update the form field answer with the project id
      if (!currentProjectId && projectField && projectFormFieldAnswer) {
        const { id: projectId } = await createProject(projectForm.getValues());
        await trigger({
          answers: [
            {
              fieldId: projectField.id,
              value: { projectId },
              id: projectFormFieldAnswer.id
            }
          ]
        });
        await mutate();
      }
      await publishProposal();
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }

  const disabledTooltip = getProposalErrors({
    page: {
      sourceTemplateId: page.sourceTemplateId,
      content: page.content,
      title: page.title,
      type: page.type
    },
    isDraft: false, // isDraft skips all errors
    proposalType: isStructuredProposal ? 'structured' : 'free_form',
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
          disabledTooltip={
            disabledTooltip || !isProjectFormValid
              ? 'Please fill out all required project fields before publishing'
              : undefined
          }
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
