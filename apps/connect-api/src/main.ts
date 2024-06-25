import { log } from '@charmverse/core/log';

import { app } from './server';

const port = 4000;
const host = '0.0.0.0';

app.listen(typeof port === 'string' ? parseInt(port) : port, host, () => {
  log.info(`Connect API server is running on http://localhost:${port}`);
});
