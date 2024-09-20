import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';

async function query() {
  // create repo
  // const repo = await prisma.githubRepo.create({
  //   data: {
  //     id: 860028062,
  //     name: 'test-repo',
  //     owner: 'charmverse',
  //     defaultBranch: 'main'
  //   }
  // });
  // console.log(repo);

  // create scout
  // const scout = await prisma.scout.create({
  //   data: {
  //     username: 'mattbot',
  //     displayName: 'Mattbot',
  //     builder: true
  //   }
  // });
  // await prisma.githubUser.update({
  //   where: {
  //     login: 'mattcasey'
  //   },
  //   data: {
  //     builderId: scout.id
  //   }
  // });
  // console.log(scout);

  // update scout instead
  // await prisma.scout.update({
  //   where: {
  //     username: 'mattbot'
  //   },
  //   data: {
  //     builder: true
  //   }
  // });

  // console.log(await prisma.githubRepo.findMany());
  // console.log(await prisma.githubUser.findMany());
  // console.log(await prisma.githubEvent.findMany());
  console.log(await prisma.builderEvent.findMany());
}

query();
