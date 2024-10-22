import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';

const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' }); // Actual launch: 2024-W40
const currentSeason = currentSeasonStartDate.toFormat(`kkkk-'W'WW`);

const names = [
  "DelegateKit - A complete Farcaster DAO toolkit",
  "Doxa: The Governance Game",
  "KelpDAO - Bringing restaking to Optimism",
  "Noun PCs - Zynga for Farcaster",
  "HyperArc - Make Social Graphs Great Again",
  "LOGX: Aggregated Orderbook Perp DEX",
  "Ponder surveys for superchain builders"
];

async function query() {
  const w = await prisma.proposal.findMany({
    where: { 
      AND: [
        { space: { domain: 'op-grants' } },
        { status: 'published' },
        { page: {
          title: {
            in: names
          }
        } }
      ]
    },
    include: {
      page: {
        select: {
          title: true,
          path: true
        }
      }
    }
  });

  prettyPrint(w.map(p => ({title: p.page!.title, path: `https://app.charmverse.io/op-grants/${p.page!.path}`})));

  console.log(w.length, names.length);
}

query();
