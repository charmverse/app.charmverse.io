import cron from 'node-cron';

import log from 'lib/log';

import app from './server/app';
import { task as archiveTask } from './tasks/deleteArchivedPages';
import { task as processWebhookMessages } from './tasks/processWebhookMessages';
import { task as notificationTask } from './tasks/sendNotifications';
import { task as proposalTask } from './tasks/updateProposalStatus';
import { task as voteTask } from './tasks/updateVotesStatus';
import { task as verifyTokenGateMembershipsTask } from './tasks/verifyTokenGateMemberships';

log.info('Starting cron jobs');

// Start processing webhook messages
processWebhookMessages();

// Delete archived pages once an hour
cron.schedule('0 * * * *', archiveTask);

// Send user task notifications by email
cron.schedule('0 * * * *', notificationTask);

// Update votes status
cron.schedule('0 */30 * * * *', voteTask);

// Close out snapshot proposals
cron.schedule('0 */15 * * * *', proposalTask);

// Verify token gates and remove users who no longer meet the conditions
cron.schedule('0 */30 * * * *', verifyTokenGateMembershipsTask);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  log.info(`Server is up and running on port ${port} in "${process.env.NODE_ENV}" env`);
});
