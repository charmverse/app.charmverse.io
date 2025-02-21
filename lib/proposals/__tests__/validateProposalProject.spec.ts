import { getProjectProfileFieldConfigDefaultHidden, getProjectProfileFieldConfig } from '@packages/testing/mocks/form';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { createDefaultProject, defaultProjectMember } from '@root/lib/projects/constants';
import { createProject } from '@root/lib/projects/createProject';
import { v4 } from 'uuid';

import { validateProposalProject } from '../validateProposalProject';

describe('validateProposalProject', () => {
  it('Should throw error if proposal project information is not valid', async () => {
    const { user } = await generateUserAndSpace();

    const createdProject = await createProject({
      userId: user.id,
      project: {
        ...createDefaultProject(),
        projectMembers: [defaultProjectMember({ teamLead: true }), defaultProjectMember()]
      }
    });
    const projectFieldId = v4();

    expect(() =>
      validateProposalProject({
        project: createdProject,
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
            fieldConfig: getProjectProfileFieldConfig({
              name: {
                required: true
              }
            })
          }
        ]
      })
    ).toThrow();
  });

  it('Should not throw error if proposal project information is valid', async () => {
    const { user } = await generateUserAndSpace();
    const projectFieldId = v4();

    const createdProject = await createProject({
      userId: user.id,
      project: {
        ...createDefaultProject(),
        name: 'Test Project',
        projectMembers: [
          defaultProjectMember({
            teamLead: true,
            name: 'Test User'
          })
        ]
      }
    });

    expect(() =>
      validateProposalProject({
        project: createdProject,
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
            fieldConfig: getProjectProfileFieldConfigDefaultHidden({
              name: {
                required: true
              }
            })
          }
        ]
      })
    ).not.toThrow();
  });
});
