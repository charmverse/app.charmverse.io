import { log } from '@charmverse/core/log';

import { app } from './server';

const port = process.env.PORT || 4000;
const host = '0.0.0.0';

app.listen(typeof port === 'string' ? parseInt(port) : port, host, () => {
  log.info(`🚀 Connect API up on http://localhost:${port}`);
});
