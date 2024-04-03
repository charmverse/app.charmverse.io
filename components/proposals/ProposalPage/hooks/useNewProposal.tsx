import { log } from '@charmverse/core/log';
import { useCallback, useState } from 'react';
import { v4 as uuid } from 'uuid';

import charmClient from 'charmClient';
import { useCreateProject, useGetProjects } from 'charmClient/hooks/projects';
import { useCreateProposal } from 'charmClient/hooks/proposals';
import { useFormFields } from 'components/common/form/hooks/useFormFields';
import type { FormFieldInput } from 'components/common/form/interfaces';
import { useProjectForm } from 'components/settings/projects/hooks/useProjectForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { defaultProjectAndMembersFieldConfig } from 'lib/projects/constants';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/interfaces';
import { getProposalErrors } from 'lib/proposals/getProposalErrors';
import { emptyDocument } from 'lib/prosemirror/constants';

import type { ProposalPageAndPropertiesInput } from '../NewProposalPage';

export type NewProposalInput = Partial<ProposalPageAndPropertiesInput> | null;

type Props = {
  newProposal: NewProposalInput;
};

export function useNewProposal({ newProposal }: Props) {
  const { user } = useUser();
  const { showMessage } = useSnackbar();
  const { space: currentSpace } = useCurrentSpace();
  const { trigger: createProposalTrigger, isMutating: isCreatingProposal } = useCreateProposal();
  const { trigger: createProject } = useCreateProject();
  const [contentUpdated, setContentUpdated] = useState(false);
  // keep track of whether the form is "loaded" so we can hide elements that depend on it. TODO: maybe formInputs should be null at first?
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [formInputs, setFormInputsRaw] = useState<ProposalPageAndPropertiesInput>(
    emptyState({ ...newProposal, userId: user?.id })
  );
  const isStructured = formInputs.proposalType === 'structured' || !!formInputs.formId;

  const proposalFormFields = (isStructured ? formInputs.formFields : []) as FormFieldInput[];

  const {
    control: proposalFormFieldControl,
    isValid: isProposalFormFieldsValid,
    errors: proposalFormFieldErrors,
    values,
    onFormChange
  } = useFormFields({
    // Only set the initial state with fields when we are creating a structured proposal
    fields: isStructured && formInputs.type === 'proposal' ? proposalFormFields : []
  });

  const { mutate } = useGetProjects();

  const projectField = formInputs.formFields?.find((field) => field.type === 'project_profile');
  const selectedProjectId = projectField ? (values[projectField.id] as { projectId: string })?.projectId : undefined;

  const projectForm = useProjectForm({
    projectId: selectedProjectId,
    fieldConfig: (projectField?.fieldConfig ?? defaultProjectAndMembersFieldConfig) as ProjectAndMembersFieldConfig,
    defaultRequired: true
  });

  const setFormInputs = useCallback(
    (partialFormInputs: Partial<ProposalPageAndPropertiesInput>, { fromUser = true }: { fromUser?: boolean } = {}) => {
      if (fromUser) {
        setContentUpdated(true);
      }
      setIsFormLoaded(true); // form is loaded when we first apply templates, workflows, content from templates, etc.
      setFormInputsRaw((existingFormInputs) => ({ ...existingFormInputs, ...partialFormInputs }));
    },
    [setFormInputsRaw]
  );

  const isDirty = projectForm.formState.isDirty;

  async function createProposal({ isDraft }: { isDraft?: boolean }) {
    // Create a project if the proposal has a project field
    let projectId: string | undefined = selectedProjectId;
    // Make sure the form is dirty before either updating or creating the project
    // We allow saving draft without a project or a valid project
    // This guard will make sure we don't create empty projects when saving drafts
    if (projectField && formInputs.type === 'proposal' && isDirty) {
      if (!selectedProjectId) {
        const projectValues = projectForm.getValues();
        const createdProject = await createProject(projectValues);
        projectId = createdProject.id;
      }
      // Make sure the current user is a team lead before updating the project
      else {
        const projectWithMembers = projectForm.getValues();
        const isTeamLead = projectWithMembers.projectMembers[0].userId === user?.id;
        if (isTeamLead) {
          const updatedProjectValues = {
            id: selectedProjectId,
            ...projectWithMembers,
            projectMembers: projectWithMembers.projectMembers
          };
          await charmClient.projects.updateProject(selectedProjectId, updatedProjectValues);
        } else {
          const projectMember = projectWithMembers.projectMembers.find(
            (_projectMember) => _projectMember.userId === user?.id
          );
          if (projectMember && projectMember.id) {
            await charmClient.projects.updateProjectMember({
              memberId: projectMember.id,
              payload: projectMember,
              projectId: selectedProjectId
            });
          }
        }
        mutate();
      }
    }
    log.info('[user-journey] Create a proposal');
    if (currentSpace) {
      const result = await createProposalTrigger({
        proposalTemplateId: formInputs.proposalTemplateId,
        authors: formInputs.authors,
        pageProps: {
          content: formInputs.content,
          contentText: formInputs.contentText ?? '',
          title: formInputs.title,
          sourceTemplateId: formInputs.proposalTemplateId,
          headerImage: formInputs.headerImage,
          icon: formInputs.icon,
          type: formInputs.type
        },
        projectId,
        formFields: formInputs.formFields,
        evaluations: formInputs.evaluations,
        spaceId: currentSpace.id,
        fields: formInputs.fields,
        formId: formInputs.formId,
        formAnswers: formInputs.formAnswers,
        workflowId: formInputs.workflowId!,
        isDraft,
        selectedCredentialTemplates: formInputs.selectedCredentialTemplates ?? [],
        sourcePageId: formInputs.sourcePageId,
        sourcePostId: formInputs.sourcePostId
      }).catch((err: any) => {
        showMessage(err.message ?? 'Something went wrong', 'error');
        throw err;
      });
      setContentUpdated(false);
      return result;
    }
  }

  const disabledTooltip = getProposalErrors({
    page: {
      title: formInputs.title,
      type: formInputs.type,
      content: formInputs.content
    },
    proposalType: formInputs.proposalType,
    proposal: formInputs,
    isDraft: false,
    requireTemplates: !!currentSpace?.requireProposalTemplate
  }).join('\n');

  return {
    formInputs,
    setFormInputs,
    createProposal,
    disabledTooltip,
    isCreatingProposal,
    contentUpdated,
    isFormLoaded,
    projectField,
    isProposalFormFieldsValid,
    proposalFormFields,
    projectForm,
    onFormChange,
    proposalFormFieldErrors,
    proposalFormFieldControl,
    isProposalProjectFieldValid: projectForm.formState.isValid
  };
}

function emptyState({
  userId,
  ...inputs
}: Partial<ProposalPageAndPropertiesInput> & { userId?: string }): ProposalPageAndPropertiesInput {
  const isStructured = inputs.proposalType === 'structured' || !!inputs.formId;
  return {
    createdAt: new Date().toISOString(),
    proposalType: 'free_form',
    content: null,
    contentText: '',
    headerImage: null,
    icon: null,
    proposalTemplateId: null,
    evaluations: [],
    title: '',
    type: 'proposal',
    selectedCredentialTemplates: [],
    fields: { properties: {}, enableRewards: true },
    ...inputs,
    formFields: isStructured
      ? [
          {
            type: 'project_profile',
            name: '',
            description: emptyDocument,
            index: 0,
            options: [],
            private: false,
            required: true,
            id: uuid(),
            fieldConfig: defaultProjectAndMembersFieldConfig
          } as FormFieldInput
        ]
      : [],
    // leave authors empty for proposals
    authors: inputs.type !== 'proposal_template' && userId ? [userId] : []
  };
}
