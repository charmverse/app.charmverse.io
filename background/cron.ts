import { log } from '@charmverse/core/log';
import cron from 'node-cron';
import { Server } from 'socket.io';

import { updateMixpanelProfilesTask } from 'background/tasks/updateMixpanelProfilesTask';
import { createOffchainCredentialsForExternalProjects } from 'lib/credentials/createOffchainCredentialsForExternalProjects';
import { relay } from 'lib/websockets/relay';

import app from './healthCheck/app';
import { countAllSpacesBlocksTask } from './tasks/countAllSpacesBlocksTask';
import { task as archiveTask } from './tasks/deleteArchivedPages';
import { indexPendingCredentialsTask } from './tasks/indexPendingCredentialsTask';
import { task as processCollablandWebhookMessages } from './tasks/processCollablandWebhookMessages';
import { task as processGithubWebhookMessages } from './tasks/processGithubWebhookMessages';
import { task as processMailgunWebhookMessages } from './tasks/processMailgunWebhookMessages';
import { task as processSynapsWebhookMessages } from './tasks/processSynapsWebhookMessages';
import { refreshBountyApplications } from './tasks/refreshBountyApplications/task';
import { sendDraftProposalNotificationTask } from './tasks/sendDraftProposalNotificationTask';
import { syncOptimismReviewsTask } from './tasks/syncOptimismReviews';
import { syncSummonSpacesRoles } from './tasks/syncSummonSpaceRoles/task';
import { task as proposalTask } from './tasks/updateProposalStatus';
import { task as voteTask } from './tasks/updateVotesStatus';
import { task as verifyTokenGateMembershipsTask } from './tasks/verifyTokenGateMemberships';

// Initiate Redis adapter for socket.io
relay.bindServer(new Server());

log.info('Starting cron jobs');

// Start processing collabland webhook messages
processCollablandWebhookMessages();

// Start processing github webhook messages
processGithubWebhookMessages();

// Start processing synaps webhook messages
processSynapsWebhookMessages();

// Start processing mailgun webhook messages
processMailgunWebhookMessages();

// Delete archived pages once an hour
cron.schedule('0 * * * *', archiveTask);

// Send notification to draft proposal authors once an hour
cron.schedule('0 * * * *', sendDraftProposalNotificationTask);

// Index pending gnosis safe credentials every 30 minutes
cron.schedule('*/30 * * * *', indexPendingCredentialsTask);

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
cron.schedule('0 0 * * *', createOffchainCredentialsForExternalProjects);

// Sync op reviews once an hour - remove by July 2024
cron.schedule('0 * * * *', syncOptimismReviewsTask);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  log.info(`Server is up and running on port ${port} in "${process.env.NODE_ENV}" env`);
});
