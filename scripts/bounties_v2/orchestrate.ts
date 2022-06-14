import log from 'lib/log';
import { eliminateDuplicateApplications, setApplicationSpaceIds, updateExistingAssigneeApplicationStatuses } from './applications';
import { applyDefaultSettings, convertAssignedAndReviewBountiesToInProgress, rollupExistingBounties } from './bounties';
import { portTransactionDataFromBountiesToApplications } from './transactions';

async function LGTMWithBountiesv2 () {

  log.info('Applying default bounty settings');
  await applyDefaultSettings();

  log.info('Converting bounties to correct status');
  await convertAssignedAndReviewBountiesToInProgress();

  log.info('Eliminating duplicate apps');
  await eliminateDuplicateApplications();

  log.info('Adding application space ids');
  await setApplicationSpaceIds();

  log.info('Updating application statuses');
  await updateExistingAssigneeApplicationStatuses();

  log.info('Porting transaction data');
  await portTransactionDataFromBountiesToApplications();

  log.info('Rolling up bounty statuses');
  await rollupExistingBounties();

  return true;

}

LGTMWithBountiesv2()
  .then(() => {
    log.info('Complete');
  });

