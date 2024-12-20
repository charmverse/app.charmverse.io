import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { FormField, Space, User } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { createForm } from '@root/lib/proposals/forms/createForm';
import type { FormFieldInput } from '@root/lib/proposals/forms/interfaces';
import { upsertProposalFormFields } from '@root/lib/proposals/forms/upsertProposalFormFields';
import { v4 } from 'uuid';

const numberFieldInput: FormFieldInput = {
  id: v4(),
  type: 'number',
  name: 'number name',
  description: 'number description',
  index: 1,
  options: [],
  private: true,
  required: true,
  fieldConfig: {},
  dependsOnStepIndex: null
};

describe('upsertProposalFormFields', () => {
  let user: User;
  let space: Space;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    user = generated.user;
    space = generated.space;
  });

  it('should update existing fields and add new fields to existing proposal form template', async () => {
    const proposal = await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: user.id
    });

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
    // add form to proposal
    await prisma.proposal.update({ where: { id: proposal.id }, data: { formId } });

    const updatedFieldsInput = [...fieldsInput, numberFieldInput];

    const fields = await upsertProposalFormFields({
      proposalId: proposal.id,
      formFields: updatedFieldsInput
    });

    expect(fields).toEqual<FormField[]>(
      expect.arrayContaining(updatedFieldsInput.map((field) => expect.objectContaining({ ...field, formId })))
    );

    const updatedShortTextInput = { ...fieldsInput[0], name: 'updated name' };
    const updatedFieldsInput2 = [updatedShortTextInput, fieldsInput[1], numberFieldInput];

    const fields2 = await upsertProposalFormFields({
      proposalId: proposal.id,
      formFields: updatedFieldsInput2
    });

    expect(fields2).toEqual<FormField[]>(
      expect.arrayContaining(updatedFieldsInput2.map((field) => expect.objectContaining({ ...field, formId })))
    );
  });

  it('should delete criteria which were not provided', async () => {
    const proposal = await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: user.id
    });

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
        required: false,
        fieldConfig: {},
        dependsOnStepIndex: null
      }
    ];

    const formId = await createForm(fieldsInput);
    // add form to proposal
    await prisma.proposal.update({ where: { id: proposal.id }, data: { formId } });

    const updatedFieldsInput = [fieldsInput[0]];

    const fields = await upsertProposalFormFields({
      proposalId: proposal.id,
      formFields: updatedFieldsInput
    });

    expect(fields).toEqual<FormField[]>(
      expect.arrayContaining(updatedFieldsInput.map((field) => expect.objectContaining({ ...field, formId })))
    );
  });

  it('should throw an error if no form fields were provided', async () => {
    await expect(
      upsertProposalFormFields({
        proposalId: v4(),
        formFields: []
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
