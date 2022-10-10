import { Server } from 'socket.io';

import { baseUrl } from 'config/constants';
import log from 'lib/log';

export const io = new Server({
  cors: {
    origin: baseUrl,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  // ...
  // xlog.info('new connection!', socket);
  log.info('new connection!');
});
