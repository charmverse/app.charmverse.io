import type { User } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { getProjectProfileFieldConfig } from '@packages/testing/mocks/form';
import { createDefaultProject, defaultProjectMember } from '@packages/lib/projects/constants';
import { createProject } from '@packages/lib/projects/createProject';
import type { ProjectAndMembersFieldConfig } from '@packages/lib/projects/formField';
import type { ProjectWithMembers } from '@packages/lib/projects/interfaces';
import type { FormFieldInput } from '@packages/lib/proposals/forms/interfaces';
import { v4 } from 'uuid';

import { getProposalProjectFormAnswers } from '../getProposalProjectFormAnswers';

const fieldsInput: FormFieldInput[] = [
  {
    id: v4(),
    type: 'project_profile',
    name: 'Project profile',
    description: '',
    index: 0,
    options: [],
    private: false,
    required: true,
    fieldConfig: getProjectProfileFieldConfig({
      walletAddress: {
        private: true
      },
      projectMember: {
        walletAddress: {
          private: false
        },
        email: {
          private: true
        }
      }
    }),
    dependsOnStepIndex: null
  }
];

describe('getProposalProjectFormAnswers', () => {
  let user: User;
  let projectWithMembers: ProjectWithMembers;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    user = generated.user;
    projectWithMembers = await createProject({
      project: {
        ...createDefaultProject(),
        walletAddress: randomETHWalletAddress(),
        projectMembers: [
          defaultProjectMember({
            teamLead: true,
            walletAddress: randomETHWalletAddress(),
            email: `${v4()}@gmail.com`
          })
        ]
      },
      userId: user.id
    });
  });

  it('should replace private field with empty string if the user does not have access to view the private project fields', async () => {
    const projectWithoutPrivateFields = getProposalProjectFormAnswers({
      canViewPrivateFields: false,
      projectWithMembers,
      fieldConfig: fieldsInput[0].fieldConfig as ProjectAndMembersFieldConfig
    });

    expect(projectWithoutPrivateFields.walletAddress).toBe('');
    // Since the field is not marked as private the value will not be redacted
    expect(projectWithoutPrivateFields.projectMembers[0].walletAddress).toBe(
      projectWithMembers.projectMembers[0].walletAddress
    );
    expect(projectWithoutPrivateFields.projectMembers[0].email).toBe('');
  });

  it('should not replace private field with empty string if the user have access to view the private project fields', async () => {
    const projectWithoutPrivateFields = getProposalProjectFormAnswers({
      canViewPrivateFields: true,
      projectWithMembers,
      fieldConfig: fieldsInput[0].fieldConfig as ProjectAndMembersFieldConfig
    });

    expect(projectWithoutPrivateFields.walletAddress).toBe(projectWithMembers.walletAddress);
    expect(projectWithoutPrivateFields.projectMembers[0].walletAddress).toBe(
      projectWithMembers.projectMembers[0].walletAddress
    );
    expect(projectWithoutPrivateFields.projectMembers[0].email).toBe(projectWithMembers.projectMembers[0].email);
  });
});
