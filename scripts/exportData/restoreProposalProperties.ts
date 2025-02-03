import { prisma } from '@charmverse/core/prisma-client';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prettyPrint } from 'lib/utils/strings';
// This script restores the tree of deleted pages and boards based on a single parent

const fileName = `./op-backup-02-2025.json`;
const pathName = path.join(process.cwd(), fileName);

type RestoreData = Awaited<ReturnType<typeof queryData>>;

// Change this to grab the data you want to restore
async function queryData() {
  const proposals = await prisma.proposalBlock.findMany({
    where: {
      type: 'board',
      space: {
        domain: 'op-grants'
      }
    }
  });

  const rewards = await prisma.rewardBlock.findMany({
    where: {
      type: 'board',
      space: {
        domain: 'op-grants'
      }
    }
  });
  prettyPrint(proposals);
  prettyPrint(rewards);
  return { proposals, rewards };
}

// Make sure this saves all the data you want to restore
async function saveData(data: RestoreData) {
  const proposalBoard = await prisma.proposalBlock.findFirstOrThrow({
    where: {
      type: 'board',
      space: {
        domain: 'op-grants'
      }
    }
  });

  const rewardBoard = await prisma.rewardBlock.findFirstOrThrow({
    where: {
      type: 'board',
      space: {
        domain: 'op-grants'
      }
    }
  });

  const proposalBackup = data.proposals[0];
  const rewardBackup = data.rewards[0];
  // const deletedProposalProps = proposalBackup.fields!.cardProperties.filter(
  //   (prop) => !proposalBoard.fields!.cardProperties.some((p) => p.id === prop.id)
  // );
  // console.log('deleted rewards props', deletedProposalProps);

  // const deletedRewardProps = rewardBackup.fields!.cardProperties.filter(
  //   (prop) => !rewardBoard.fields!.cardProperties.some((p) => p.id === prop.id)
  // );
  // console.log('deleted rewards props', deletedRewardProps);

  console.log(
    'properties in backup',
    data.proposals[0].fields.cardProperties.length,
    data.rewards[0].fields.cardProperties.length
  );
  console.log(
    'properties in db',
    proposalBoard.fields!.cardProperties.length,
    rewardBoard.fields!.cardProperties.length
  );
  const keeptitles = ['Created time', 'Cycle', 'Subcommittee'];
  // restore proposal properties
  await prisma.proposalBlock.update({
    where: {
      id_spaceId: {
        id: proposalBoard.id,
        spaceId: proposalBoard.spaceId
      }
    },
    data: {
      fields: {
        //...proposalBackup.fields,
        cardProperties: proposalBackup.fields!.cardProperties.map((d) => ({
          ...d,
          deletedAt: keeptitles.includes(d.name) ? null : new Date(2025, 0, 21, 0, 0, 0)
        }))
      }
    }
  });

  // restore reward properties
  await prisma.rewardBlock.update({
    where: {
      id_spaceId: {
        id: rewardBoard.id,
        spaceId: rewardBoard.spaceId
      }
    },
    data: {
      fields: {
        ...rewardBackup.fields,
        cardProperties: [
          ...rewardBackup.fields!.cardProperties.map((d) => ({
            ...d,
            deletedAt: new Date(2025, 0, 21, 0, 0, 0)
          })),
      }
    }
  });
}

function readJson(): Promise<RestoreData> {
  return fs.readFile(pathName).then((file) => JSON.parse(file.toString()));
}

function writeJson(data: RestoreData) {
  return fs.writeFile(pathName, JSON.stringify(data, null, 2)).then(() => data);
}

// run this while pointed at a backup database
function download() {
  return queryData()
    .then(writeJson)
    .then((r) => {
      console.log('Saved data to: ', pathName);
    });
}

// run this while pointed at target database
function upload() {
  return readJson()
    .then(saveData)
    .then((r) => console.log('Uploaded records'));
}

upload();
//download();
