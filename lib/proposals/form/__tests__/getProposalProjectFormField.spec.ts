import type { User } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import type { FormFieldInput } from 'components/common/form/interfaces';
import { defaultProjectFieldConfig, defaultProjectValues } from 'lib/projects/constants';
import { createProject } from 'lib/projects/createProject';
import type { ProjectAndMembersFieldConfig, ProjectWithMembers } from 'lib/projects/interfaces';
import { randomETHWalletAddress } from 'testing/generateStubs';

import { getProposalProjectFormField } from '../getProposalProjectFormField';

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
    fieldConfig: {
      ...defaultProjectFieldConfig,
      walletAddress: {
        private: true
      },
      projectMember: {
        ...defaultProjectFieldConfig.projectMember,
        walletAddress: {
          private: false
        },
        email: {
          private: true
        }
      }
    }
  }
];

describe('getProposalProjectFormField', () => {
  let user: User;
  let projectWithMembers: ProjectWithMembers;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    user = generated.user;
    projectWithMembers = await createProject({
      project: {
        ...defaultProjectValues,
        walletAddress: randomETHWalletAddress(),
        projectMembers: [
          {
            ...defaultProjectValues.projectMembers[0],
            walletAddress: randomETHWalletAddress(),
            email: `${v4()}@gmail.com`
          }
        ]
      },
      userId: user.id
    });
  });

  it('should replace private field with empty string if the user does not have access to view the private project fields', async () => {
    const projectWithoutPrivateFields = getProposalProjectFormField({
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
    const projectWithoutPrivateFields = getProposalProjectFormField({
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
