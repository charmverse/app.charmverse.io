import { InvalidInputError } from '@charmverse/core/errors';
import { v4 } from 'uuid';

import {
  createDefaultProjectAndMembersFieldConfig,
  createDefaultProjectAndMembersPayload
} from 'lib/projects/constants';
import { createProject } from 'lib/projects/createProject';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { validateProposalProject } from '../validateProposalProject';

describe('validateProposalProject', () => {
  it('Should throw error if proposal project information is not valid', async () => {
    const { user } = await generateUserAndSpaceWithApiToken();
    const projectValues = createDefaultProjectAndMembersPayload();

    const createdProject = await createProject({
      userId: user.id,
      project: {
        ...projectValues,
        projectMembers: [projectValues.projectMembers[0], projectValues.projectMembers[0]]
      }
    });
    const projectFieldId = v4();

    await expect(
      validateProposalProject({
        projectId: createdProject.id,
        formAnswers: [
          {
            fieldId: projectFieldId,
            value: {
              selectedMemberIds: [createdProject.projectMembers[0].id],
              projectId: createdProject.id
            }
          }
        ],
        formFields: [
          {
            id: projectFieldId,
            type: 'project_profile',
            fieldConfig: {
              ...createDefaultProjectAndMembersFieldConfig(),
              name: {
                required: true
              }
            }
          }
        ]
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('Should not throw error if proposal project information is valid', async () => {
    const { user } = await generateUserAndSpaceWithApiToken();
    const defaultProjectAndMembersPayload = createDefaultProjectAndMembersPayload();
    const projectFieldId = v4();

    const createdProject = await createProject({
      userId: user.id,
      project: {
        ...defaultProjectAndMembersPayload,
        name: 'Test Project',
        projectMembers: [
          {
            ...defaultProjectAndMembersPayload.projectMembers[0],
            name: 'Test User'
          }
        ]
      }
    });

    await expect(
      validateProposalProject({
        defaultRequired: false,
        projectId: createdProject.id,
        formAnswers: [
          {
            fieldId: projectFieldId,
            value: {
              selectedMemberIds: [createdProject.projectMembers[0].id],
              projectId: createdProject.id
            }
          }
        ],
        formFields: [
          {
            id: projectFieldId,
            type: 'project_profile',
            fieldConfig: {
              ...createDefaultProjectAndMembersFieldConfig(),
              name: {
                required: true
              }
            }
          }
        ]
      })
    ).resolves.toBeUndefined();
  });
});
