import cron from 'node-cron';
import log from 'lib/log';
import { task as notificationTask } from './tasks/sendNotifications';
import { task as archiveTask } from './tasks/deleteArchivedPages';

log.debug('Starting cron jobs');

// Delete archived pages once an hour
cron.schedule('0 * * * *', archiveTask);

// Send user task notifications by email
cron.schedule('0 * * * *', notificationTask);
