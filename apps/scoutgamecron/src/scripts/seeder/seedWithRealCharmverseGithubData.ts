import { prisma } from '@charmverse/core/prisma-client';

import { processPullRequests } from '../../tasks/processPullRequests';

//@ts-ignore
import {registerBuilderNFT} from '../../../../scoutgame/lib/builderNFTs/registerBuilderNFT'

const devUsers = {
  mattcasey: {
    id: 305398,
    avatar: 'https://app.charmverse.io/favicon.png'
  },
  motechFR: {
    id: 18669748,
    avatar:
      'https://cdn.charmverse.io/user-content/e0ec0ec8-0c1f-4745-833d-52c448482d9c/0dd0e3c0-821c-49fc-bd1a-7589ada03019/1ff23917d3954f92aed4351b9c8caa36.jpg'
  },
  Devorein: {
    id: 25636858,
    avatar:
      'https://cdn.charmverse.io/user-content/5906c806-9497-43c7-9ffc-2eecd3c3a3ec/cbed10a8-4f05-4b35-9463-fe8f15413311/b30047899c1514539cc32cdb3db0c932.jpg'
  },
  valentinludu: {
    id: 34683631,
    avatar:
      'https://cdn.charmverse.io/user-content/f50534c5-22e7-47ee-96cb-54f4ce1a0e3e/42697dc0-35ad-4361-8311-a92702c76062/breaking_wave.jpg'
  }
};

const repoOwner = 'charmverse';

// Obtained from https://api.github.com/repos/charmverse/app.charmverse.io
const repoId = 444649883;

const repoName = 'app.charmverse.io';

export async function seedWithRealCharmverseGithubData() {
  // Initialize the github repo
  let githubRepo = await prisma.githubRepo.findFirst({
    where: {
      owner: repoOwner,
      name: repoName
    }
  });

  if (!githubRepo) {
    githubRepo = await prisma.githubRepo.create({
      data: {
        defaultBranch: 'main',
        name: repoName,
        owner: repoOwner,
        id: repoId
      }
    });
  }

  const devUserEntries = Object.entries(devUsers);

  for (const [builder, { avatar, id }] of devUserEntries) {
    const githubUser = await prisma.githubUser.findUnique({
      where: {
        login: builder
      }
    });

    if (!githubUser) {
      await prisma.githubUser.create({
        data: {
          id,
          login: builder,
          displayName: builder,
          builder: {
            create: {
              displayName: builder,
              username: builder,
              builder: true,
              avatar
            }
          }
        }
      });
    } else if (!githubUser?.builderId) {
      await prisma.githubUser.update({
        where: {
          login: builder
        },
        data: {
          builder: {
            create: {
              displayName: builder,
              username: builder,
              builder: true,
              avatar: avatar
            }
          }
        }
      });
    }
  }

  await processPullRequests({ createdAfter: new Date('2024-08-01'), skipClosedPrProcessing:true });

}

async function seedBuilderNFTs() {
  const githubUser = await prisma.githubUser.findMany({
    where: {
      login: {
        in: Object.keys(devUsers)
      }
    }
  });

  console.log('githubUser', githubUser);

  for (const { builderId } of githubUser) {
    await registerBuilderNFT({builderId: builderId as string});
  }
}

// seedWithRealCharmverseGithubData();

seedBuilderNFTs();


// prisma.githubEvent.deleteMany().then(console.log)