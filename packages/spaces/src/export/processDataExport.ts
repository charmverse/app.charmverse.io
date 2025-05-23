import { log } from '@charmverse/core/log';
import type { SpaceExportJob } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { createDataExport } from './createDataExport';
import { uploadDataExport } from './uploadDataExport';

// generate and upload a zip of the space data to s3, then update the job with the download link
export async function processDataExport(job: SpaceExportJob) {
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

    // Update the job with the download URL
    await prisma.spaceExportJob.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        downloadLink
      }
    });

    log.info('Completed space export requested by user', {
      userId: job.createdBy,
      spaceId: job.spaceId,
      jobId: job.id,
      downloadLink
    });
  } catch (error) {
    log.error('Error processing space export', { error, userId: job.createdBy, spaceId: job.spaceId, jobId: job.id });

    // Update job with error status
    await prisma.spaceExportJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    });
  }
}
