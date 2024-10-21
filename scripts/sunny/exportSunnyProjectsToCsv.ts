import { prisma } from '@charmverse/core/prisma-client';
import { FarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';
import { stringify } from 'csv-stringify/sync';
import { optimism } from 'viem/chains';
import { writeFileSync } from 'node:fs';

const baseUrl = 'https://register.thesunnyawards.fun';

const hideList = [4339, 4356, 472, 290639];

async function exportSunnyProjectsToCsv() {
  const projects = await prisma.project.findMany({
    where: {
      source: 'sunny_awards',
      projectMembers: {
        every: {
          farcasterId: {
            notIn: hideList
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
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
      gitcoinProjectAttestations: {
        where: {
          chainId: optimism.id,
          type: 'application'
        }
      },
      projectMembers: {
        select: {
          user: {
            select: {
              farcasterUser: true
            }
          }
        }
      }
    }
  });

  const newLine = '\n';

  const rows = projects.map((project) => {
    const creatorAccount = project.user.farcasterUser?.account as FarcasterProfile['body'];

    const attestationUid = project.pptimismProjectAttestations[0]?.metadataAttestationUID;
    const gitcoinAttestationUid = project.gitcoinProjectAttestations[0]?.attestationUID;

    return {
      Url: `${baseUrl}/p/${project.path}`,
      Created: project.createdAt.toUTCString(),
      Name: project.name,
      Type: project.sunnyAwardsProjectType || '',
      Creator: `https://warpcast.com/${creatorAccount.username}`,
      'Team members': project.projectMembers
        .map((member) => (member.user?.farcasterUser?.account as FarcasterProfile['body'])?.username)
        .join(', '),
      Category: project.sunnyAwardsCategory || '',
      Website: project.websites[0] || '',
      'Additional Urls': project.websites.slice(1).join(newLine) || '',
      Github: project.github || '',
      Twitter: project.twitter || '',
      Description: project.description || '',
      'Agora Metadata Attestation': attestationUid
        ? `https://optimism.easscan.org/attestation/view/${attestationUid}`
        : '',
      'EasyRetroPGF Metadata Attestation': gitcoinAttestationUid
        ? `https://optimism.easscan.org/attestation/view/${gitcoinAttestationUid}`
        : ''
    };
  });

  const csvString = stringify(rows, {
    delimiter: '\t',
    header: true,
    columns: Object.keys(rows[0])
  });

  writeFileSync(`./scripts/sunny/project-export.csv`, csvString);
}

exportSunnyProjectsToCsv().catch(console.error);
