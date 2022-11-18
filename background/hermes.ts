import { Server } from 'socket.io';

import { socketsPort } from 'config/constants';
import log from 'lib/log';
import { relay } from 'lib/websockets/relay';

const port = socketsPort || process.env.PORT as string;

const io = new Server();

relay.bindServer(io);

io.listen(parseInt(port));

log.info('Socket server listening to port: ', port);
