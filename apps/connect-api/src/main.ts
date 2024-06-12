import { log } from '@charmverse/core/log';

import { app } from './server';

const port = process.env.PORT || 3333;
const host = '0.0.0.0';

app.listen(typeof port === 'string' ? parseInt(port) : port, host, () => {
  log.info(`Builder API server is running on http://localhost:${port}`);
});
