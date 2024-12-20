import { InvalidInputError } from '@charmverse/core/errors';
import type { FormFieldAnswer, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal } from 'testing/utils/proposals';

import { createForm } from '../createForm';
import type { FormFieldInput } from '../interfaces';
import { upsertProposalFormAnswers } from '../upsertProposalFormAnswers';

describe('upsertFormAnswers', () => {
  let proposal: Awaited<ReturnType<typeof generateProposal>>;
  let space: Space;
  let user: User;

  beforeEach(async () => {
    const generated = await generateUserAndSpace({
      isAdmin: true
    });

    space = generated.space;
    user = generated.user;

    proposal = await generateProposal({
      proposalStatus: 'published',
      spaceId: space.id,
      userId: user.id
    });
  });

  it('should create form answers', async () => {
    const fieldsInput: FormFieldInput[] = [
      {
        id: v4(),
        type: 'short_text',
        name: 'name',
        description: 'description',
        index: 0,
        options: [],
        private: false,
        required: false,
        fieldConfig: {},
        dependsOnStepIndex: null
      },
      {
        id: v4(),
        type: 'long_text',
        name: 'long name',
        description: 'another description',
        index: 1,
        options: [],
        private: true,
        required: false,
        fieldConfig: {},
        dependsOnStepIndex: null
      }
    ];

    const formId = await createForm(fieldsInput);

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { formId }
    });

    const answer1 = {
      fieldId: fieldsInput[0].id,
      value: 'John Doe'
    };

    const updated1 = await upsertProposalFormAnswers({
      proposalId: proposal.id,
      answers: [answer1]
    });
    expect(updated1).toBeDefined();

    expect(updated1).toEqual<FormFieldAnswer[]>(
      expect.arrayContaining([
        { ...answer1, id: expect.any(String), fieldId: fieldsInput[0].id, proposalId: proposal.id, type: 'short_text' }
      ])
    );

    const answer2 = {
      fieldId: fieldsInput[1].id,
      value: 'John Wick'
    };

    const updated2 = await upsertProposalFormAnswers({
      proposalId: proposal.id,
      answers: [answer2]
    });
    expect(updated2).toBeDefined();

    expect(updated2).toEqual<FormFieldAnswer[]>(
      expect.arrayContaining([
        { ...answer1, id: expect.any(String), fieldId: fieldsInput[0].id, proposalId: proposal.id, type: 'short_text' },
        { ...answer2, id: expect.any(String), fieldId: fieldsInput[1].id, proposalId: proposal.id, type: 'long_text' }
      ])
    );
  });

  it('should create form answers for required fields', async () => {
    const fieldsInput: FormFieldInput[] = [
      {
        id: v4(),
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
        id: v4(),
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

    const formId = await createForm(fieldsInput);

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { formId }
    });

    const answer1 = {
      fieldId: fieldsInput[0].id,
      value: 'John Doe'
    };

    const answer2 = {
      fieldId: fieldsInput[1].id,
      value: 'John Wick'
    };

    const updated1 = await upsertProposalFormAnswers({
      proposalId: proposal.id,
      answers: [answer1, answer2]
    });
    expect(updated1).toBeDefined();

    expect(updated1).toEqual<FormFieldAnswer[]>(
      expect.arrayContaining([
        { ...answer1, id: expect.any(String), fieldId: fieldsInput[0].id, proposalId: proposal.id, type: 'short_text' },
        { ...answer2, id: expect.any(String), fieldId: fieldsInput[1].id, proposalId: proposal.id, type: 'long_text' }
      ])
    );
  });

  it('should update form answers', async () => {
    const fieldsInput: FormFieldInput[] = [
      {
        id: v4(),
        type: 'short_text',
        name: 'name',
        description: 'description',
        index: 0,
        options: [],
        private: false,
        required: false,
        fieldConfig: {},
        dependsOnStepIndex: null
      },
      {
        id: v4(),
        type: 'long_text',
        name: 'long name',
        description: 'another description',
        index: 1,
        options: [],
        private: true,
        required: false,
        fieldConfig: {},
        dependsOnStepIndex: null
      }
    ];

    const formId = await createForm(fieldsInput);

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { formId }
    });

    const answer1 = {
      fieldId: fieldsInput[0].id,
      value: 'John Doe'
    };

    const updated1 = await upsertProposalFormAnswers({
      proposalId: proposal.id,
      answers: [answer1]
    });
    expect(updated1).toBeDefined();

    expect(updated1).toEqual<FormFieldAnswer[]>(
      expect.arrayContaining([
        { ...answer1, id: expect.any(String), fieldId: fieldsInput[0].id, proposalId: proposal.id, type: 'short_text' }
      ])
    );

    const updatedAnswer = {
      fieldId: fieldsInput[0].id,
      value: 'John Wick'
    };

    const updated2 = await upsertProposalFormAnswers({
      proposalId: proposal.id,
      answers: [updatedAnswer]
    });
    expect(updated2).toBeDefined();

    expect(updated2).toEqual<FormFieldAnswer[]>(
      expect.arrayContaining([
        {
          ...updatedAnswer,
          id: expect.any(String),
          fieldId: fieldsInput[0].id,
          proposalId: proposal.id,
          type: 'short_text'
        }
      ])
    );
  });

  it('should throw an error if not all required fields were provided', async () => {
    const fieldsInput: FormFieldInput[] = [
      {
        id: v4(),
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
        id: v4(),
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

    const formId = await createForm(fieldsInput);

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { formId }
    });

    await expect(
      upsertProposalFormAnswers({
        proposalId: proposal.id,
        answers: [{ fieldId: fieldsInput[0].id, value: '' }]
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    // allow draft override
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: 'draft' }
    });

    await expect(
      upsertProposalFormAnswers({
        proposalId: proposal.id,
        answers: [{ fieldId: fieldsInput[0].id, value: '123' }]
      })
    ).resolves.toBeTruthy();
  });

  it('should throw an error if invalid fieldId was provided', async () => {
    const fieldsInput: FormFieldInput[] = [
      {
        id: v4(),
        type: 'short_text',
        name: 'name',
        description: 'description',
        index: 0,
        options: [],
        private: false,
        required: false,
        fieldConfig: {},
        dependsOnStepIndex: null
      }
    ];

    const formId = await createForm(fieldsInput);

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { formId }
    });

    await expect(
      upsertProposalFormAnswers({
        proposalId: proposal.id,
        answers: [{ fieldId: v4(), value: '123' }]
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
