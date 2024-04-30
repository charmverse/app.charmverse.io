import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsProposals } from '@charmverse/core/test';

import { getPageMarkdown } from 'lib/pages/getPageMarkdown';
import type { FieldConfig } from 'lib/projects/formField';
import { projectFieldProperties } from 'lib/projects/formField';
import { jsonDoc, _ } from 'lib/prosemirror/builders';
import { getProfectProfileFieldConfigDefaultHidden } from 'testing/mocks/form';
import { generateUserAndSpace } from 'testing/setupDatabase';

describe('getPageMarkdown', () => {
  it('should get markdown content for a page', async () => {
    const markdownContent = 'markdownContent';

    const { space, user } = await generateUserAndSpace();
    const page = await testUtilsPages.generatePage({
      content: jsonDoc(_.p(markdownContent)),
      spaceId: space.id,
      createdBy: user.id
    });

    const result = await getPageMarkdown({ pageId: page.id });

    expect(result).toEqual(markdownContent);
  });

  it('should get markdown content for a form proposal', async () => {
    const markdownContent = 'markdownContent';

    const { space, user } = await generateUserAndSpace();
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });
    const page = await testUtilsPages.generatePage({
      content: jsonDoc(_.p(markdownContent)),
      spaceId: space.id,
      createdBy: user.id,
      type: 'proposal',
      proposalId: proposal.id
    });

    const form = await prisma.form.create({
      data: {
        proposal: {
          connect: {
            id: proposal.id
          }
        },
        formFields: {
          createMany: {
            data: [
              {
                index: 0,
                name: 'Email',
                type: 'email'
              },
              {
                index: 1,
                name: 'Short Text',
                type: 'short_text'
              },
              {
                index: 2,
                name: 'Long Text',
                type: 'long_text'
              },
              {
                index: 3,
                name: 'Project Profile',
                type: 'project_profile',
                fieldConfig: getProfectProfileFieldConfigDefaultHidden({
                  github: {
                    show: true
                  },
                  projectMember: {
                    email: {
                      show: true
                    },
                    walletAddress: {
                      show: true
                    }
                  }
                })
              }
            ]
          }
        }
      },
      include: {
        formFields: true
      }
    });

    // create and attach a test project
    const project = await prisma.project.create({
      data: {
        createdBy: user.id,
        updatedBy: user.id,
        name: 'Test project',
        github: 'https://github.com/charmverse/app.charmverse.io',
        projectMembers: {
          createMany: {
            data: [
              {
                name: 'First guy',
                updatedBy: user.id,
                walletAddress: '0x1234567890'
              }
            ]
          }
        }
      },
      include: { projectMembers: true }
    });

    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
        formId: form.id,
        projectId: project.id
      }
    });

    await prisma.formFieldAnswer.createMany({
      data: [
        {
          fieldId: form.formFields[0].id,
          value: 'safwan@gmail.com',
          proposalId: proposal.id,
          type: 'email'
        },
        {
          fieldId: form.formFields[1].id,
          value: 'short text',
          proposalId: proposal.id,
          type: 'short_text'
        },
        {
          fieldId: form.formFields[2].id,
          value: { contentText: '', content: jsonDoc(_.p('long text')) },
          proposalId: proposal.id,
          type: 'long_text'
        }
      ]
    });

    const result = await getPageMarkdown({ pageId: page.id });

    expect(result).toEqual(
      `
### Email

safwan@gmail.com

### Short Text

short text

### Long Text

long text

### Project Profile

- GitHub: ${project.github}

- Project Members

  - First guy

    - Wallet address: ${project.projectMembers[0].walletAddress}

    - Email: N/A
`.trim()
    );
  });
});
