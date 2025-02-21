import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsProposals } from '@charmverse/core/test';
import { getProjectProfileFieldConfigDefaultHidden } from '@packages/testing/mocks/form';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { getPageMarkdown } from '@root/lib/pages/getPageMarkdown';
import type { SelectOptionType } from '@root/lib/proposals/forms/interfaces';
import { _, jsonDoc } from '@root/lib/prosemirror/builders';

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
      userId: user.id,
      fields: {
        pendingRewards: [
          {
            page: {
              title: 'Cheez wizard'
            },
            reward: {
              rewardType: 'custom',
              customReward: 'All the cheese'
            }
          },
          {
            page: {
              title: 'Payout'
            },
            reward: {
              chainId: 1,
              rewardType: 'token',
              rewardAmount: 100,
              rewardToken: 'ETH'
            }
          }
        ]
      }
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
                name: 'First label',
                description: jsonDoc(_.p('First label description')),
                type: 'label'
              },
              {
                index: 1,
                name: 'Email',
                type: 'email'
              },
              {
                index: 2,
                name: 'Short Text',
                type: 'short_text'
              },
              {
                index: 3,
                name: 'Long Text',
                type: 'long_text'
              },
              {
                index: 4,
                name: 'Project Profile',
                type: 'project_profile',
                fieldConfig: getProjectProfileFieldConfigDefaultHidden({
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
              },
              {
                index: 5,
                name: 'Select Field',
                type: 'select',
                options: [{ id: 'select-option-1', name: 'Option 1' } as SelectOptionType]
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
                teamLead: true,
                name: 'First guy',
                updatedBy: user.id,
                walletAddress: '0x1234567890'
              },
              {
                name: 'Second guy',
                updatedBy: user.id,
                walletAddress: '0x1234567890'
              },
              {
                name: 'Third guy',
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
          fieldId: form.formFields[1].id,
          value: 'safwan@gmail.com',
          proposalId: proposal.id,
          type: 'email'
        },
        {
          fieldId: form.formFields[2].id,
          value: 'short text',
          proposalId: proposal.id,
          type: 'short_text'
        },
        {
          fieldId: form.formFields[3].id,
          value: { contentText: '', content: jsonDoc(_.p('long text')) },
          proposalId: proposal.id,
          type: 'long_text'
        },
        {
          fieldId: form.formFields[4].id,
          value: {
            projectId: project.id,
            selectedMemberIds: [project.projectMembers[1].id]
          },
          proposalId: proposal.id,
          type: 'project_profile'
        },
        {
          fieldId: form.formFields[5].id,
          value: 'select-option-1',
          proposalId: proposal.id,
          type: 'select'
        }
      ]
    });

    const result = await getPageMarkdown({ pageId: page.id });

    expect(result).toEqual(
      `
## First label

First label description

### Email

safwan@gmail.com

### Short Text

short text

### Long Text

long text

### Project Profile

- GitHub: https://github.com/charmverse/app.charmverse.io

- Project Members

  - First guy

    - Wallet address: ${project.projectMembers[0].walletAddress}

    - Email: N/A

  - Second guy

    - Wallet address: ${project.projectMembers[1].walletAddress}

    - Email: N/A

### Select Field

Option 1

### Milestones

- Cheez wizard${'  '}
 Reward: All the cheese

- Payout${'  '}
 Token reward: 100 ETH on Ethereum
`.trim()
    );
  });
});
