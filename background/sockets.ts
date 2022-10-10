import { Server } from 'socket.io';

import log from 'lib/log';

const port = process.env.SOCKETS_PORT as string;

const io = new Server({ /* options */ });

io.on('connection', (socket) => {
  // ...
  log.info('new connection!', socket);
});

io.listen(parseInt(port));

log.info('Socket server listening to port: ', port);
