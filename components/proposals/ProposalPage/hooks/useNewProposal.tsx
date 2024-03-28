import { log } from '@charmverse/core/log';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';

import charmClient from 'charmClient';
import { useCreateProject, useGetProjects } from 'charmClient/hooks/projects';
import { useCreateProposal } from 'charmClient/hooks/proposals';
import { useFormFields } from 'components/common/form/hooks/useFormFields';
import type { FormFieldInput } from 'components/common/form/interfaces';
import { useProjectForm } from 'components/settings/projects/hooks/useProjectForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { defaultProjectFieldConfig } from 'lib/projects/constants';
import { getFilledProjectValues } from 'lib/projects/getFilledProjectValues';
import type { ProjectFieldConfig } from 'lib/projects/interfaces';
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
  const isCharmverseSpace = useIsCharmverseSpace();
  const [formInputs, setFormInputsRaw] = useState<ProposalPageAndPropertiesInput>(
    emptyState({ ...newProposal, userId: user?.id, isCharmverseSpace })
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

  const { data: projectsWithMembers, mutate } = useGetProjects();

  const projectField = formInputs.formFields?.find((field) => field.type === 'project_profile');
  const selectedProjectId = projectField ? (values[projectField.id] as { projectId: string })?.projectId : undefined;
  const projectWithMembers = projectsWithMembers?.find((project) => project.id === selectedProjectId);

  const projectForm = useProjectForm({
    projectWithMembers,
    fieldConfig: (projectField?.fieldConfig ?? defaultProjectFieldConfig) as ProjectFieldConfig,
    defaultRequired: true
  });

  const { membersRecord } = useMembers();
  const defaultProjectValues = useMemo(() => getFilledProjectValues({ user, membersRecord }), [user, membersRecord]);
  useEffect(() => {
    if (selectedProjectId) {
      projectForm.reset(projectWithMembers);
    } else {
      projectForm.reset(defaultProjectValues);
    }
  }, [selectedProjectId]);

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

  async function createProposal({ isDraft }: { isDraft?: boolean }) {
    // Create a project if the proposal has a project field
    let projectId: string | undefined = projectWithMembers?.id;
    const projectValues = projectForm.getValues();
    if (projectField && formInputs.type === 'proposal') {
      if (!selectedProjectId) {
        const createdProject = await createProject(projectValues);
        projectId = createdProject.id;
      }
      // Make sure the current user is a team lead before updating the project
      else if (projectWithMembers && user?.id === projectWithMembers.projectMembers[0].userId) {
        const updatedProjectValues = {
          id: projectWithMembers.id,
          ...projectValues,
          projectMembers: projectWithMembers.projectMembers.map((member, index) => ({
            ...member,
            ...projectValues.projectMembers[index],
            id: member.id
          }))
        };
        await charmClient.updateProject(projectWithMembers.id, updatedProjectValues);
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
        formFields: formInputs.formFields,
        evaluations: formInputs.evaluations,
        spaceId: currentSpace.id,
        fields: formInputs.fields,
        formId: formInputs.formId,
        formAnswers: formInputs.formAnswers?.map((formField) => {
          if (formField.fieldId === projectField?.id && projectId) {
            return {
              ...formField,
              value: { projectId }
            };
          }
          return formField;
        }),
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
  isCharmverseSpace,
  ...inputs
}: (Partial<ProposalPageAndPropertiesInput> & { userId?: string }) & {
  isCharmverseSpace: boolean;
}): ProposalPageAndPropertiesInput {
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
            type: isCharmverseSpace ? 'project_profile' : 'short_text',
            name: '',
            description: emptyDocument,
            index: 0,
            options: [],
            private: false,
            required: true,
            id: uuid(),
            fieldConfig: isCharmverseSpace ? { projectMember: {} } : null
          } as FormFieldInput
        ]
      : [],
    // leave authors empty for proposals
    authors: inputs.type !== 'proposal_template' && userId ? [userId] : []
  };
}
