import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { createPage } from '@packages/testing/pages';
import { createReward } from '@packages/lib/rewards/createReward';
import { v4 } from 'uuid';

import { createRewardFromIssue } from '../webhook/createRewardFromIssue';

describe('createRewardFromIssue', () => {
  it(`Should return Missing installation ID message if the installation id is missing`, async () => {
    expect(
      await createRewardFromIssue({
        message: {} as any
      })
    ).toStrictEqual({
      success: false,
      message: 'Missing installation ID.'
    });
  });

  it(`Should return an issue not open message if the issue state is not open`, async () => {
    expect(
      await createRewardFromIssue({
        message: {
          installation: {
            id: 1
          },
          issue: {
            state: 'closed'
          }
        } as any
      })
    ).toStrictEqual({
      success: true,
      message: 'Issue is not open.'
    });
  });

  it(`Should return a reward already created message if the reward already exists`, async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const githubIssueId = v4();
    const githubIssueUrl = `https://github.com/charmverse/charmverse/issues/${githubIssueId}`;
    await createReward({
      spaceId: space.id,
      userId: user.id,
      githubIssueUrl,
      reviewers: [
        {
          userId: user.id
        }
      ],
      pageProps: {
        title: 'Test'
      }
    });

    expect(
      await createRewardFromIssue({
        message: {
          installation: {
            id: 1
          },
          issue: {
            state: 'open',
            html_url: githubIssueUrl
          }
        } as any
      })
    ).toStrictEqual({
      success: true,
      message: 'Reward already created.'
    });
  });

  it(`Should return a space not found message if the space with installation id is not found`, async () => {
    const githubIssueId = v4();
    const githubIssueUrl = `https://github.com/charmverse/charmverse/issues/${githubIssueId}`;
    expect(
      await createRewardFromIssue({
        message: {
          installation: {
            id: 1
          },
          issue: {
            state: 'open',
            html_url: githubIssueUrl
          }
        } as any
      })
    ).toStrictEqual({
      success: false,
      message: 'Space not found or not connected to CharmVerse GitHub App.'
    });
  });

  it(`Should return a space not connected to rewards repo message if the space with installation id is not connected to any rewards repo`, async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const installationId = v4();
    const githubIssueId = v4();
    const githubIssueUrl = `https://github.com/charmverse/charmverse/issues/${githubIssueId}`;

    await prisma.spaceGithubConnection.create({
      data: {
        spaceId: space.id,
        createdBy: user.id,
        installationId,
        name: 'Test Github App'
      }
    });

    expect(
      await createRewardFromIssue({
        message: {
          installation: {
            id: installationId
          },
          issue: {
            state: 'open',
            html_url: githubIssueUrl
          }
        } as any
      })
    ).toStrictEqual({
      success: true,
      message: 'Space not connected to any rewards repo.'
    });
  });

  it(`Should return a github repository not connected to rewards message if the repository ids are different`, async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const installationId = v4();
    const githubRepoId = v4();
    const githubIssueId = v4();
    const githubIssueUrl = `https://github.com/charmverse/charmverse/issues/${githubIssueId}`;

    const rewardTemplatePage = await createPage({
      type: 'bounty_template',
      createdBy: user.id,
      spaceId: space.id
    });

    await prisma.spaceGithubConnection.create({
      data: {
        spaceId: space.id,
        createdBy: user.id,
        installationId,
        name: 'Test Github App',
        rewardsRepos: {
          create: {
            repositoryId: githubRepoId,
            repositoryName: 'Test Repo',
            rewardTemplateId: rewardTemplatePage.id,
            rewardAuthorId: user.id
          }
        }
      }
    });

    expect(
      await createRewardFromIssue({
        message: {
          installation: {
            id: installationId
          },
          repository: {
            id: 1
          },
          issue: {
            state: 'open',
            html_url: githubIssueUrl
          }
        } as any
      })
    ).toStrictEqual({
      success: true,
      message: 'Github repository is not connected to rewards.'
    });
  });

  it(`Should return issue doesn't have a label message if the issue doesn't have a label but is required`, async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const installationId = v4();
    const githubRepoId = v4();
    const githubIssueId = v4();
    const githubIssueUrl = `https://github.com/charmverse/charmverse/issues/${githubIssueId}`;

    const rewardTemplatePage = await createPage({
      type: 'bounty_template',
      createdBy: user.id,
      spaceId: space.id
    });

    await prisma.spaceGithubConnection.create({
      data: {
        spaceId: space.id,
        createdBy: user.id,
        installationId,
        name: 'Test Github App',
        rewardsRepos: {
          create: {
            repositoryId: githubRepoId,
            repositoryName: 'Test Repo',
            rewardTemplateId: rewardTemplatePage.id,
            rewardAuthorId: user.id,
            repositoryLabels: ['production']
          }
        }
      }
    });
    expect(
      await createRewardFromIssue({
        message: {
          installation: {
            id: installationId
          },
          repository: {
            id: githubRepoId
          },
          issue: {
            state: 'open',
            html_url: githubIssueUrl
          }
        } as any
      })
    ).toStrictEqual({
      success: true,
      message: 'Issue does not have a label.'
    });
  });

  it(`Should return issue label doesn't match the repo labels if there is a mismatch`, async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const installationId = v4();
    const githubRepoId = v4();

    const rewardTemplatePage = await createPage({
      type: 'bounty_template',
      createdBy: user.id,
      spaceId: space.id
    });

    await prisma.spaceGithubConnection.create({
      data: {
        spaceId: space.id,
        createdBy: user.id,
        installationId,
        name: 'Test Github App',
        rewardsRepos: {
          create: {
            repositoryId: githubRepoId,
            repositoryName: 'Test Repo',
            rewardTemplateId: rewardTemplatePage.id,
            rewardAuthorId: user.id,
            repositoryLabels: ['production']
          }
        }
      }
    });

    const githubIssueId = v4();
    const githubIssueUrl = `https://github.com/charmverse/charmverse/issues/${githubIssueId}`;

    expect(
      await createRewardFromIssue({
        message: {
          installation: {
            id: installationId
          },
          repository: {
            id: githubRepoId
          },
          label: {
            name: 'test'
          },
          issue: {
            state: 'open',
            html_url: githubIssueUrl
          }
        } as any
      })
    ).toStrictEqual({
      success: true,
      message: 'Issue label does not match the rewards repo labels.'
    });
  });

  it(`Should create a rewards without any rewards template id connected with rewards repo`, async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const installationId = v4();
    const githubRepoId = v4();

    await prisma.spaceGithubConnection.create({
      data: {
        spaceId: space.id,
        createdBy: user.id,
        installationId,
        name: 'Test Github App',
        rewardsRepos: {
          create: {
            repositoryId: githubRepoId,
            repositoryName: 'Test Repo',
            rewardAuthorId: user.id
          }
        }
      }
    });

    const githubIssueId = v4();
    const githubIssueUrl = `https://github.com/charmverse/charmverse/issues/${githubIssueId}`;

    expect(
      await createRewardFromIssue({
        message: {
          installation: {
            id: installationId
          },
          repository: {
            id: githubRepoId
          },
          issue: {
            state: 'open',
            title: 'Issue Title',
            html_url: githubIssueUrl
          }
        } as any
      })
    ).toStrictEqual({
      spaceIds: [space.id],
      success: true,
      message: 'Reward created.'
    });

    const spaceReward = await prisma.bounty.findFirstOrThrow({
      where: {
        spaceId: space.id
      },
      select: {
        author: {
          select: {
            id: true
          }
        },
        permissions: {
          select: {
            permissionLevel: true,
            userId: true
          }
        },
        githubIssueUrl: true,
        page: {
          select: {
            title: true
          }
        }
      }
    });

    expect(spaceReward.author.id).toBe(user.id);
    expect(spaceReward.githubIssueUrl).toBe(githubIssueUrl);
    expect(spaceReward.page!.title).toBe('Issue Title');
    expect(spaceReward.permissions).toStrictEqual([
      {
        permissionLevel: 'reviewer',
        userId: user.id
      }
    ]);
  });

  it(`Should create a rewards without a reward template id connected with rewards repo`, async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const installationId = v4();
    const githubRepoId = v4();
    const dueDate = new Date();
    const rewardTemplate = await createReward({
      spaceId: space.id,
      userId: user.id,
      allowMultipleApplications: true,
      approveSubmitters: true,
      chainId: 1,
      dueDate,
      fields: {},
      maxSubmissions: 10,
      pageProps: {
        title: 'Test',
        contentText: 'Test Content Text',
        icon: 'Test Icon',
        type: 'bounty_template'
      },
      rewardAmount: 100,
      rewardToken: 'ETH',
      rewardType: 'token',
      reviewers: [
        {
          userId: user.id
        }
      ]
    });

    await prisma.spaceGithubConnection.create({
      data: {
        spaceId: space.id,
        createdBy: user.id,
        installationId,
        name: 'Test Github App',
        rewardsRepos: {
          create: {
            repositoryId: githubRepoId,
            repositoryName: 'Test Repo',
            rewardAuthorId: user.id,
            rewardTemplateId: rewardTemplate.createdPageId
          }
        }
      }
    });

    const githubIssueId = v4();
    const githubIssueUrl = `https://github.com/charmverse/charmverse/issues/${githubIssueId}`;

    expect(
      await createRewardFromIssue({
        message: {
          installation: {
            id: installationId
          },
          repository: {
            id: githubRepoId
          },
          issue: {
            state: 'open',
            title: 'Issue Title',
            html_url: githubIssueUrl
          }
        } as any
      })
    ).toStrictEqual({
      spaceIds: [space.id],
      success: true,
      message: 'Reward created.'
    });

    const spaceReward = await prisma.bounty.findFirstOrThrow({
      where: {
        spaceId: space.id,
        id: {
          not: rewardTemplate.createdPageId
        }
      },
      select: {
        author: {
          select: {
            id: true
          }
        },
        permissions: {
          select: {
            permissionLevel: true,
            userId: true,
            roleId: true
          }
        },
        githubIssueUrl: true,
        allowMultipleApplications: true,
        approveSubmitters: true,
        dueDate: true,
        maxSubmissions: true,
        rewardAmount: true,
        rewardToken: true,
        chainId: true,
        page: {
          select: {
            icon: true,
            type: true,
            autoGenerated: true,
            contentText: true,
            title: true
          }
        }
      }
    });

    expect(spaceReward.page).toStrictEqual({
      icon: 'Test Icon',
      type: 'bounty',
      autoGenerated: true,
      contentText: 'Test Content Text',
      title: 'Issue Title'
    });
    expect(spaceReward.author.id).toBe(user.id);
    expect(spaceReward.githubIssueUrl).toBe(githubIssueUrl);
    expect(spaceReward.dueDate).toStrictEqual(dueDate);
    expect(spaceReward.allowMultipleApplications).toBe(true);
    expect(spaceReward.approveSubmitters).toBe(true);
    expect(spaceReward.maxSubmissions).toBe(10);
    expect(spaceReward.rewardAmount).toBe(100);
    expect(spaceReward.rewardToken).toBe('ETH');
    expect(spaceReward.chainId).toBe(1);
    expect(spaceReward.permissions).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          permissionLevel: 'reviewer',
          userId: user.id
        })
      ])
    );
  });
});
