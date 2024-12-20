import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { createForm } from '@root/lib/proposals/forms/createForm';
import type { FormFieldInput } from '@root/lib/proposals/forms/interfaces';
import { v4 } from 'uuid';

import { getProposalTemplate } from '../getProposalTemplate';
import type { ProposalWithUsersAndRubric } from '../interfaces';

describe('getProposal', () => {
  it('should return a proposal template', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'community'
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });

    const result = await getProposalTemplate({
      pageId: proposal.page.id
    });
    expect(result).toMatchObject(
      expect.objectContaining<Partial<ProposalWithUsersAndRubric>>({
        id: proposal.id
      })
    );
  });

  it('should return private form fields', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'community'
    });
    const fieldsInput: FormFieldInput[] = [
      {
        id: v4(),
        type: 'short_text',
        name: 'name',
        description: 'description',
        index: 0,
        options: [],
        private: true,
        required: true,
        fieldConfig: {},
        dependsOnStepIndex: null
      }
    ];
    const formId = await createForm(fieldsInput);

    const template = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      pageType: 'proposal_template'
    });
    await prisma.proposal.update({
      where: {
        id: template.id
      },
      data: {
        formId
      }
    });

    const result = await getProposalTemplate({
      pageId: template.page.id
    });

    expect(result.form?.formFields).toHaveLength(1);
    expect(result.form?.formFields![0]).toEqual(expect.objectContaining(fieldsInput[0]));
  });
});
