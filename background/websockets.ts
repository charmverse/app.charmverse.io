import { Server } from 'socket.io';

import { baseUrl } from 'config/constants';
import log from 'lib/log';
import { relay } from 'lib/websockets/relay';

const port = process.env.PORT as string;

const io = new Server({
  cors: {
    allowedHeaders: ['authorization'],
    credentials: true,
    origin: baseUrl || '*.charmverse.co' // use wildcard for staging
  }
});

relay.bindServer(io);

io.listen(parseInt(port));

log.info('Web socket server listening to port: ', port);
