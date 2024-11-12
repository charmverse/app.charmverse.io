import { octokit } from '@packages/github/client';
import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
async function main() {
  const user = await prisma.scout.update({
    where: {
      path: 'lilfrog-eth'
    },
    data: {
      avatar: 'https://avatars.githubusercontent.com/u/12549482?v=4'
    }
  });
  prettyPrint(user);
  // const gUser = await octokit.rest.users.getByUsername({ username: user.githubUser[0].login });
  // prettyPrint(gUser);
}

main();
