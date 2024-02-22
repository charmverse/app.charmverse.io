import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import type { FormFieldInput } from 'components/common/form/interfaces';
import { createForm } from 'lib/form/createForm';

import { getProposal } from '../getProposal';
import type { ProposalWithUsersAndRubric } from '../interface';

describe('getProposal', () => {
  it('should return a proposal', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'community'
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });

    const result = await getProposal({
      id: proposal.id,
      permissionsByStep: {
        draft: {} as any
      }
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
        required: true
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

    const result = await getProposal({
      id: template.id,
      permissionsByStep: {
        draft: {
          view_private_fields: true
        } as any
      }
    });

    expect(result.form?.formFields).toHaveLength(1);
    expect(result.form?.formFields![0]).toEqual(expect.objectContaining(fieldsInput[0]));
  });
});
