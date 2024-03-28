import { log } from '@charmverse/core/log';
import cron from 'node-cron';

import { updateMixpanelProfilesTask } from 'background/tasks/updateMixpanelProfilesTask';
import { createOffchainCredentialsForExternalProjects } from 'lib/credentials/createOffchainCredentialsForExternalProjects';

import app from './healthCheck/app';
import { countAllSpacesBlocksTask } from './tasks/countAllSpacesBlocksTask';
import { task as archiveTask } from './tasks/deleteArchivedPages';
import { task as processWebhookMessages } from './tasks/processWebhookMessages';
import { refreshBountyApplications } from './tasks/refreshBountyApplications/task';
import { syncSummonSpacesRoles } from './tasks/syncSummonSpaceRoles/task';
import { task as proposalTask } from './tasks/updateProposalStatus';
import { task as voteTask } from './tasks/updateVotesStatus';
import { task as verifyTokenGateMembershipsTask } from './tasks/verifyTokenGateMemberships';

log.info('Starting cron jobs');

// Start processing webhook messages
processWebhookMessages();

// Delete archived pages once an hour
cron.schedule('0 * * * *', archiveTask);

// Update votes status
cron.schedule('*/30 * * * *', voteTask);

// Close out snapshot proposals
cron.schedule('*/15 * * * *', proposalTask);

// Verify token gates and remove users who no longer meet the conditions
cron.schedule('*/30 * * * *', verifyTokenGateMembershipsTask);

// Refresh applications with pending payments
cron.schedule('*/30 * * * *', refreshBountyApplications);

// Count blocks in all spaces
cron.schedule('*/30 * * * *', countAllSpacesBlocksTask);

// Update space mixpanel profiles once a day at 1am
cron.schedule('0 1 * * *', updateMixpanelProfilesTask);

// Sync summon space roles every day at midnight
cron.schedule('0 0 * * *', syncSummonSpacesRoles);

// Create external eas credentials for Gitcoin and Questbook every day at midnight
// cron.schedule('0 0 * * *', createOffchainCredentialsForExternalProjects);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  log.info(`Server is up and running on port ${port} in "${process.env.NODE_ENV}" env`);
});
