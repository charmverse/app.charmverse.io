import { log } from '@charmverse/core/log';

import { prepareServer } from './prepareServer';

const port = process.env.PORT || 4000;
const host = '0.0.0.0';

prepareServer().then((app) =>
  app.listen(typeof port === 'string' ? parseInt(port) : port, host, () => {
    log.info(`Builder API server is running on http://localhost:${port}`);
  })
);
