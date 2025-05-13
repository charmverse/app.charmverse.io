import { log } from '@charmverse/core/log';
import { storeOptimismProjectAttestations } from '@packages/lib/optimism/storeOptimismProjectAttestations';

export async function task() {
  log.debug('Running store-optimism-project-attestation cron job');

  try {
    const totalUpdatedProjects = await storeOptimismProjectAttestations();
    log.info(`Updated ${totalUpdatedProjects} projects`);
  } catch (error: any) {
    log.error(`Error storing optimism project attestations: ${error.stack || error.message || error}`, { error });
  }
}
