import { eliminateDuplicateApplications, setApplicationSpaceIds, updateExistingAssigneeApplicationStatuses } from './applications';
import { applyDefaultSettings, convertAssignedAndReviewBountiesToInProgress, rollupExistingBounties } from './bounties';
import { portTransactionDataFromBountiesToApplications } from './transactions';

async function LGTMWithBountiesv2 () {

  console.log('Applying default bounty settings');
  await applyDefaultSettings();

  console.log('Converting bounties to correct status');
  await convertAssignedAndReviewBountiesToInProgress();

  console.log('Eliminating duplicate apps');
  await eliminateDuplicateApplications();

  console.log('Adding application space ids');
  await setApplicationSpaceIds();

  console.log('Updating application statuses');
  await updateExistingAssigneeApplicationStatuses();

  console.log('Porting transaction data');
  await portTransactionDataFromBountiesToApplications();

  console.log('Rolling up bounty statuses');
  await rollupExistingBounties();

  return true;

}

LGTMWithBountiesv2()
  .then(() => {
    console.log('Complete');
  });

