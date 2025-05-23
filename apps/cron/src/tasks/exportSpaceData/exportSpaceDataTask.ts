import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import * as mailer from '@packages/lib/mailer';
import { zipContent } from '@packages/lib/utils/file';
import { processDataExport } from '@packages/spaces/export/processDataExport';
import { DateTime } from 'luxon';

const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

export async function exportSpaceDataTask() {
  // Find a pending export job
  const pendingJob = await prisma.spaceExportJob.findFirst({
    where: {
      status: 'pending'
    },
    include: {
      space: {
        select: {
          id: true,
          name: true
        }
      },
      author: {
        select: {
          id: true,
          email: true,
          username: true
        }
      }
    }
  });

  if (!pendingJob) {
    return;
  }

  // Export the space data
  log.info('Exporting space data', {
    jobId: pendingJob.id,
    spaceId: pendingJob.spaceId,
    userId: pendingJob.createdBy
  });

  await processDataExport(pendingJob);
}

// Check for stale jobs
export async function checkStaleExportJobs() {
  const oneHourAgo = new Date(Date.now() - ONE_HOUR);

  const staleJobs = await prisma.spaceExportJob.findMany({
    where: {
      status: 'pending',
      createdAt: {
        lt: oneHourAgo
      }
    },
    include: {
      space: {
        select: {
          name: true
        }
      },
      author: {
        select: {
          email: true,
          username: true,
          id: true
        }
      }
    }
  });

  for (const job of staleJobs) {
    // Update job status to failed
    await prisma.spaceExportJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        error: 'Job timed out after 1 hour'
      }
    });
    log.error('Stale export job timed out', {
      jobId: job.id,
      spaceId: job.spaceId,
      userId: job.createdBy
    });

    // Send timeout notification
    if (job.author.email) {
      await mailer.sendEmail({
        to: {
          displayName: job.author.username,
          email: job.author.email,
          userId: job.author.id
        },
        subject: `Space Export Timed Out - ${job.space.name}`,
        text: `Your space export for ${job.space.name} has timed out after 1 hour. Please try again.`
      });
    }
  }
}
