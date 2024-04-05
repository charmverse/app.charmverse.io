import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { createWorkspace } from 'lib/spaces/createSpace';
import { getFilenameWithExtension } from 'lib/utils/getFilenameWithExtension';

const spaceDomain = "wallet-user";

export async function generateOpGrantSpaces() {
  const proposals = await prisma.proposal.findMany({
    where: {
      space: {
        domain: spaceDomain
      },
      page: {
        type: "proposal",
        createdAt: {
          gte: new Date("2024-01-01T00:00:00Z")
        }
      },
      archived: false,
      status: "published",
    },
    select: {
      form: {
        select: {
          formFields: {
            select: {
              name: true,
              answers: true
            }
          }
        }
      },
      page: {
        select: {
          title: true,
          icon: true,
        }
      },
      authors: {
        select: {
          userId: true
        }
      },
    }
  });

  const total = proposals.length;
  let count = 0;

  for (const proposal of proposals) {
    const projectName = proposal.page!.title;
    try {
      const authorIds = proposal.authors.map((author) => author.userId);
      const spaceImageUrl = proposal.page?.icon?.replace(/[\n\r]/g, '');
      let spaceImage: string | null = null;
      const adminUserId = authorIds[0];
      if (spaceImageUrl) {
        const pathInS3 = getUserS3FilePath({ userId: adminUserId, url: getFilenameWithExtension(spaceImageUrl) });
        try {
          const { url } = await uploadUrlToS3({ pathInS3, url: spaceImageUrl });
          spaceImage = url;
        } catch (error) {
          log.error(`error uploading space image ${projectName}`, spaceImageUrl, error);
        }
      }
      const space = await createWorkspace({
        spaceData: {
          name: projectName,
          spaceImage,
          origin: spaceDomain,
        },
        userId: adminUserId,
        extraAdmins: authorIds.slice(1),
        spaceTemplate: 'templateImpactCommunity',
      });

      // mark space as created from gitcoin in mixpanel
      await updateTrackGroupProfile(space, spaceDomain);
      console.log(`Created space for project ${projectName} (${++count}/${total})`);
    } catch(_) {
      count++;
      log.error(`Failed to create space for proposal ${projectName}`);
    }
  }
}

generateOpGrantSpaces().then(() => console.log('Done'));
