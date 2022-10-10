
import { socketsHost, socketsPort } from 'config/constants';
import log from 'lib/log';

import { io } from './sockets/socketServer';

if (socketsPort) {
  io.listen(parseInt(socketsPort));

  log.info('Socket server listening at', socketsHost);
}
