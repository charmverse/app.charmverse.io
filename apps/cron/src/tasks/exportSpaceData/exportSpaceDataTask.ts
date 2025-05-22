import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import * as mailer from '@packages/lib/mailer';
import { zipContent } from '@packages/lib/utils/file';
import { exportSpaceData } from '@packages/spaces/getSpaceDataForExport';
import { DateTime } from 'luxon';

const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

export async function exportSpaceDataTask() {
  log.debug('Running export space data task');

  try {
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

    // Double check job is still pending before processing
    const job = await prisma.spaceExportJob.findUnique({
      where: { id: pendingJob.id },
      select: { status: true }
    });

    if (!job || job.status !== 'pending') {
      return;
    }

    try {
      // Export the space data
      const exportedData = await exportSpaceData({ spaceIdOrDomain: pendingJob.space.id });

      // Create zip file
      const zipBuffer = await zipContent({
        content: JSON.stringify(exportedData, null, 2),
        filename: `space-export-${pendingJob.space.id}.json`
      });

      // Upload to S3
      // TODO: Implement S3 upload
      const s3Url = 'https://example.com/export.zip'; // Placeholder

      // Double check job is still pending before updating
      const jobBeforeUpdate = await prisma.spaceExportJob.findUnique({
        where: { id: pendingJob.id },
        select: { status: true }
      });

      if (!jobBeforeUpdate || jobBeforeUpdate.status !== 'pending') {
        return;
      }

      // Update job status to complete
      await prisma.spaceExportJob.update({
        where: { id: pendingJob.id },
        data: {
          status: 'completed',
          downloadLink: s3Url
        }
      });

      // Send email notification
      if (pendingJob.author.email) {
        await mailer.sendEmail({
          to: {
            displayName: pendingJob.author.username,
            email: pendingJob.author.email,
            userId: pendingJob.author.id
          },
          subject: `Space Export Complete - ${pendingJob.space.name}`,
          text: `Your space export for ${pendingJob.space.name} is ready. You can download it here: ${s3Url}`
        });
      }
    } catch (error) {
      log.error('Error processing space export job', { error, jobId: pendingJob.id });

      // Update job status to failed
      await prisma.spaceExportJob.update({
        where: { id: pendingJob.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      // Send error notification
      if (pendingJob.author.email) {
        await mailer.sendEmail({
          to: {
            displayName: pendingJob.author.username,
            email: pendingJob.author.email,
            userId: pendingJob.author.id
          },
          subject: `Space Export Failed - ${pendingJob.space.name}`,
          text: `There was an error exporting your space ${pendingJob.space.name}. Please try again later.`
        });
      }
    }
  } catch (error) {
    log.error('Error in export space data task', { error });
  }
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
