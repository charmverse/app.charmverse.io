import { log } from '@charmverse/core/log';
import type { SpaceExportJob } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

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
      userId: job.createdBy
    });
    // Upload to s3
    const downloadLink = await uploadDataExport({
      compressed,
      spaceId: job.spaceId,
      userId: job.createdBy
    });

    const { status: latestJobStatus } = await prisma.spaceExportJob.findUnique({
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
      await mailer.sendEmail({
        to: {
          displayName: result.author.username,
          email: result.author.email,
          userId: result.author.id
        },
        subject: `Data Export Complete - ${result.space.name}`,
        text: `Your export for ${result.space.name} is ready. You can download it here: ${s3Url}`
      });
    }
    return { result: 'completed', status: 'completed' };
  } catch (error) {
    log.error('Error processing space export', { error, userId: job.createdBy, spaceId: job.spaceId, jobId: job.id });

    // Double check job is still pending before processing
    const { status: latestJobStatus } = await prisma.spaceExportJob.findUnique({
      where: { id: job.id },
      select: {
        status: true
      }
    });

    if (latestJobStatus !== 'pending') {
      return { result: 'already_processed', status: latestJobStatus };
    }
    // Update job with error status
    await prisma.spaceExportJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
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
    return { result: 'failed', status: 'failed', error };
  }
}
