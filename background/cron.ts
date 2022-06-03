import cron from 'node-cron';
import log from 'lib/log';
import { task as notificationTask } from './tasks/sendNotifications';
import { task as archiveTask } from './tasks/deleteArchivedPages';

log.debug('Starting cron jobs');

// Cron job that runs every hour
cron.schedule('0 * * * *', archiveTask);

// Cron job that runs at 12pm EST every day
// cron.schedule('0 16 * * *', notificationTask);
cron.schedule('*/10 * * * *', notificationTask); // every 5 minutes for testing
