import log from 'lib/log';
import cron from 'node-cron';
import app from './server/app';
import { task as archiveTask } from './tasks/deleteArchivedPages';
import { task as notificationTask } from './tasks/sendNotifications';
import { task as voteTask } from './tasks/updateVotesStatus';

log.info('Starting cron jobs');

// Delete archived pages once an hour
cron.schedule('0 * * * *', archiveTask);

// Send user task notifications by email
cron.schedule('0 * * * *', notificationTask);

// Update votes status
cron.schedule('0 */30 * * * *', voteTask);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  log.info(`Server is up and running on port ${port} in "${process.env.NODE_ENV}" env`);
});
