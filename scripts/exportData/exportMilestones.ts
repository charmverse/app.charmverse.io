import { Block, prisma } from "@charmverse/core/prisma-client";

import { stringify } from 'csv-stringify/sync';
import { CardFields } from "lib/databases/card";
import { RewardFields } from "lib/rewards/blocks/interfaces";
import { prettyPrint } from "lib/utils/strings";

import { writeFileSync } from 'fs';

const spaceDomain = 'demo-space';

const milestoneTypeProperty = {
  "id": "6b4a0ac7-8a69-45e1-b112-a12779483f06",
  "name": "Milestone Type",
  "type": "select",
  "options": [
    {
      "id": "ff571db9-e4b8-4a98-8ed8-12a7fdc326e5",
      "color": "propColorYellow",
      "value": "Critical"
    },
    {
      "id": "254a7f5f-9328-474c-bbf2-7d0c03529898",
      "color": "propColorPurple",
      "value": "Benchmark"
    }
  ]
}


async function exportMilestones({spaceDomain}: {spaceDomain: string}) {
  const milestonesFromRewards = await prisma.bounty.findMany({
    where: {
      space: {
        domain: spaceDomain
      },
      proposal: {
        status: 'published'
      }
    },
    orderBy: {
      proposalId: 'asc'
    },
    include: {
      applications: {
        where: {
          status: {
            in: ['review', 'processing', 'paid', 'complete']
          }
        }
      },
      page: true,
      proposal: {
        select: {
          page: {
            select: {
              createdAt: true,
              title: true
            }
          }
        }
      }
    }
  });



  const rows = milestonesFromRewards.map((milestone) => {

    const cardProps = milestone.fields as CardFields;

    const milestoneType = cardProps?.properties[milestoneTypeProperty.id];
    const value = milestoneTypeProperty.options.find((option) => option.id === milestoneType)?.value;

    console.log('Milestone:', milestone);

    return {
      Title: milestone.proposal?.page?.title,
      "Proposal creation date": new Date(milestone.proposal?.page?.createdAt as any).toUTCString(),
      rewardAmount: milestone.rewardType === 'custom' ? milestone.customReward : milestone.rewardType === 'token' ? (milestone.rewardAmount ?? '') + ' ' + (milestone.rewardToken ?? '') : '',
      "Has Provided Submissions": milestone.applications.length ? 'Yes' : 'No',
      "Milestone Type": value
    }
  });

  const csv = stringify(rows, {header: true, columns: Object.keys(rows[0])});

  writeFileSync('milestones.csv', csv); 
}

exportMilestones({spaceDomain}).then(console.log);

// prisma.rewardBlock.findMany({
//   where: {
//     space: {
//       domain: spaceDomain
//     }
//   }
// }).then(prettyPrint)