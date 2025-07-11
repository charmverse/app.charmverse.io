import type { SpaceExportJob } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import { sendPlainEmail } from '@packages/lib/mailer';

import { createDataExport } from './createDataExport';
import { uploadDataExport } from './uploadDataExport';

// generate and upload a zip of the space data to s3, then update the job with the download link
export async function processDataExport(
  job: SpaceExportJob
): Promise<{ result: 'completed' | 'failed' | 'already_processed'; status?: 'completed' | 'failed'; error?: any }> {
  try {
    // Create the export data
    const compressed = await createDataExport({
      spaceId: job.spaceId,
      userId: job.createdBy,
      jobId: job.id
    });
    // Upload to s3
    const downloadLink = await uploadDataExport({
      compressed,
      spaceId: job.spaceId,
      userId: job.createdBy
    });

    const { status: latestJobStatus } = await prisma.spaceExportJob.findUniqueOrThrow({
      where: { id: job.id },
      select: {
        status: true
      }
    });
    if (latestJobStatus !== 'pending') {
      log.warn('Completed job is no longer pending, skipping update', {
        jobId: job.id,
        latestJobStatus
      });
      return { result: 'already_processed', status: latestJobStatus };
    }

    // Update the job with the download URL
    const result = await prisma.spaceExportJob.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        downloadLink
      },
      select: {
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        space: {
          select: {
            name: true
          }
        }
      }
    });

    log.info('Completed space export requested by user', {
      userId: job.createdBy,
      spaceId: job.spaceId,
      jobId: job.id,
      downloadLink
    });

    // Send email notification
    if (result.author.email) {
      await sendPlainEmail({
        to: {
          displayName: result.author.username,
          email: result.author.email,
          userId: result.author.id
        },
        subject: `Data Export complete for ${result.space.name}`,
        html: [
          `Your export for ${result.space.name} is ready.`,
          `You can download it here: <a href="${downloadLink}">Click to download</a>`
        ]
      });
    }
    return { result: 'completed', status: 'completed' };
  } catch (error) {
    log.error('Error processing space export', { error, userId: job.createdBy, spaceId: job.spaceId, jobId: job.id });

    // Double check job is still pending before processing
    const { status: latestJobStatus } = await prisma.spaceExportJob.findUniqueOrThrow({
      where: { id: job.id },
      select: {
        status: true
      }
    });

    if (latestJobStatus !== 'pending') {
      return { result: 'already_processed', status: latestJobStatus };
    }
    // Update job with error status
    const result = await prisma.spaceExportJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      select: {
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        space: {
          select: {
            name: true
          }
        }
      }
    });
    // Send error notification
    if (result.author.email) {
      await sendPlainEmail({
        to: {
          displayName: result.author.username,
          email: result.author.email,
          userId: result.author.id
        },
        subject: `Space Export failed for ${result.space.name}`,
        html: `Unfortunately, there was an error exporting your space ${result.space.name}. Please contact support at hello@charmverse.io.`
      });
    }
    return { result: 'failed', status: 'failed', error };
  }
}
