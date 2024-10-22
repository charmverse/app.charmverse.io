import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { registerBuilderNFT } from '@packages/scoutgame/builderNfts/registerBuilderNFT';
import { Season, getDateFromISOWeek } from '@packages/scoutgame/dates';
import { recordMergedPullRequest } from '../tasks/processBuilderActivity/recordMergedPullRequest';
import { recordCommit } from '../tasks/processBuilderActivity/recordCommit';

export async function approveBuilder({
  githubLogin,
  builderId,
  season
}: {
  githubLogin?: string;
  builderId?: string;
  season: Season;
}) {
  if (githubLogin && builderId) {
    throw new Error('Only provide githubLogin or builderId');
  }
  if (githubLogin && builderId) {
    throw new Error('githubLogin or builderId is required');
  }

  const builder = await prisma.scout.findFirstOrThrow({
    where: {
      id: builderId,
      githubUser: githubLogin
        ? {
            some: {
              login: githubLogin
            }
          }
        : undefined
    },
    include: {
      githubUser: true
    }
  });

  builderId = builder.id;

  const githubUser = builder.githubUser[0];

  if (!githubUser) {
    throw new Error(`Builder ${builder.id} : ${builder.displayName} does not have a github user connected`);
  }

  log.info(`Found builder using Github Account ${githubUser.login}`);

  const events = await prisma.githubEvent.findMany({
    where: {
      githubUser: {
        login: githubUser.login
      },
      completedAt: {
        gte: getDateFromISOWeek(season).toJSDate()
      }
    },
    include: {
      repo: true
    }
  });

  log.info(`Found ${events.length} Git events for builder ${builderId}`);

  for (const gitEvent of events) {
    if (gitEvent.type === 'merged_pull_request') {
      await recordMergedPullRequest({
        season,
        pullRequest: {
          ...gitEvent,
          createdAt: new Date(gitEvent.createdAt).toDateString(),
          number: gitEvent.pullRequestNumber!,
          author: {
            id: githubUser.id,
            login: githubUser.login
          },
          repository: {
            databaseId: gitEvent.repo.id,
            id: gitEvent.repo.id,
            name: gitEvent.repo.name,
            owner: { login: gitEvent.repo.owner },
            defaultBranchRef: { name: gitEvent.repo.defaultBranch },
            nameWithOwner: `${gitEvent.repo.owner}/${gitEvent.repo.name}`
          }
        },
        repo: gitEvent.repo
      }).catch((error) => log.error('Error processing pull request', { error, gitEvent }));
    } else {
      if (gitEvent.type === 'commit') {
        await recordCommit({
          season,
          commit: {
            sha: gitEvent.commitHash!,
            html_url: `https://github.com/${gitEvent.repo.owner}/${gitEvent.repo.name}/commit/${gitEvent.commitHash}`,
            commit: {
              author: {
                date: gitEvent.createdAt.toISOString()
              },
              committer: {
                date: gitEvent.createdAt.toISOString()
              },
              message: gitEvent.title
            },
            author: {
              id: githubUser.id,
              login: githubUser.login
            },
            repository: {
              id: gitEvent.repo.id,
              name: gitEvent.repo.name,
              full_name: `${gitEvent.repo.owner}/${gitEvent.repo.name}`
            }
          }
        }).catch((error) => log.error('Error processing commit', { error, gitEvent }));
      }
    }
  }

  const scout = await prisma.scout.update({
    where: {
      id: builderId
    },
    data: {
      builderStatus: 'approved'
    }
  });

  await registerBuilderNFT({ builderId: scout.id, season });
}
