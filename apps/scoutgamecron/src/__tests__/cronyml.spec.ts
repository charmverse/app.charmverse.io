import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import yaml from 'js-yaml';

import app from '../worker';

describe('cron.yml check', () => {
  test('all jobs should have tasks in the worker', async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const cronFilePath = path.resolve(__dirname, '../../cron.yml');
    const cronFile = fs.readFileSync(cronFilePath, 'utf8');
    const cronConfig = yaml.load(cronFile) as { cron?: { url: string }[] };

    expect(cronConfig).toBeDefined();
    expect(cronConfig.cron).toBeDefined();

    const workerFilePath = path.resolve(__dirname, '../worker.ts');
    const workerFile = fs.readFileSync(workerFilePath, 'utf8');

    if (cronConfig.cron) {
      cronConfig.cron.forEach((job) => {
        expect(workerFile).toContain(`addTask('${job.url}'`);
      });
    }
  });
});
