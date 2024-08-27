import { prisma } from "@charmverse/core/prisma-client";
import { FarcasterProfile } from "@root/lib/farcaster/getFarcasterProfile";
import { stringify } from 'csv-stringify/sync';
import { optimism } from "viem/chains";
import { writeFileSync } from "node:fs";

const baseUrl = 'https://register.thesunnyawards.fun';

async function exportSunnyProjectsToCsv() {

  const projects = await prisma.project.findMany({
    where: {
      source: 'sunny_awards'
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10,
    include: {
      user: {
        include: {
          farcasterUser: true
        }
      },
      pptimismProjectAttestations: {
        where: {
          chainId: optimism.id
        }
      },
      projectMembers: {
        select: {
          farcasterId: true
        }
      }
    }
  });

  const newLine = '\n';

  const rows = projects.map(project => {

    const creatorAccount = project.user.farcasterUser?.account as FarcasterProfile['body'];

    const attestationUid = project.pptimismProjectAttestations?.find(attestation => attestation.chainId === optimism.id)?.metadataAttestationUID;

    return {
      Url: `${baseUrl}/p/${project.path}`,
      Created: project.createdAt.toUTCString(),
      Name: project.name,
      Type: project.sunnyAwardsProjectType || '',
      Creator: `https://warpcast.com/${creatorAccount.username}`,
      "Team members": project.projectMembers.map(member => member.farcasterId).join(", "),
      Category: project.sunnyAwardsCategory || '',
      Website: project.websites[0] || '',
      "Additional Urls": project.websites.slice(1).join(newLine)  || '',
      "Github": project.github || '',
      "Twitter": project.twitter || '',
      "Description": project.description || '',
      "Agora Metadata Attestation": attestationUid ? `https://optimism.easscan.org/attestation/view/${attestationUid}` : '',
    }
  })

  const csvString = stringify(rows, {
    delimiter: '\t',
    header: true,
    columns: Object.keys(rows[0])
  });

  console.log(csvString);
  writeFileSync(`./scripts/sunny/project-export.csv`, csvString);

}


exportSunnyProjectsToCsv().catch(console.error);