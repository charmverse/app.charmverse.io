import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generateProposalWorkflow } from '@packages/testing/utils/proposals';
import type { FormFieldInput } from '@root/lib/proposals/forms/interfaces';
import { v4 as uuid } from 'uuid';

import { createDraftProposal } from '../createDraftProposal';

describe('createDraftProposal', () => {
  it('Create proposal template with existing form', async () => {
    const { user, space } = await generateUserAndSpace();
    const workflow = await generateProposalWorkflow({ spaceId: space.id });

    const formFields: FormFieldInput[] = [
      {
        id: uuid(),
        type: 'short_text',
        name: 'name',
        description: 'description',
        index: 0,
        options: [],
        private: false,
        required: true,
        fieldConfig: {},
        dependsOnStepIndex: null
      },
      {
        id: uuid(),
        type: 'long_text',
        name: 'long name',
        description: 'another description',
        index: 1,
        options: [],
        private: true,
        required: true,
        fieldConfig: {},
        dependsOnStepIndex: null
      }
    ];

    const proposalTemplate = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      workflowId: workflow.id
    });

    const proposalTemplateForm = await prisma.form.create({
      data: {
        proposal: {
          connect: {
            id: proposalTemplate.id
          }
        }
      }
    });

    await prisma.formField.createMany({
      data: formFields.map((item) => ({
        ...item,
        description: item.description ?? '',
        formId: proposalTemplateForm.id,
        fieldConfig: {}
      }))
    });

    const { page, proposal } = await createDraftProposal({
      createdBy: user.id,
      pageType: 'proposal_template',
      spaceId: space.id,
      templateId: proposalTemplate.id
    });

    expect(proposal.formId).toBeDefined();

    const newProposalTemplateForm = await prisma.form.findUniqueOrThrow({
      where: {
        id: proposal.formId as string
      },
      select: {
        id: true
      }
    });

    // New form should be created since we are duplicating a proposal template
    expect(newProposalTemplateForm.id).not.toEqual(proposalTemplateForm.id);

    expect(page).toMatchObject(
      expect.objectContaining({
        type: 'proposal_template'
      })
    );
  });
});
