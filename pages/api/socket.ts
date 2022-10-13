import type { NextApiRequest, NextApiResponse } from 'next';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';

function messageHandler (socket: Socket) {
  socket.on('message', (message) => {
    socket.emit('message', 'Hello from the server!');
  });
}

export default function socketHandler (req: NextApiRequest, res: NextApiResponse) {

  // It means that socket server was already initialised
  if (res.socket?.server?.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server);

  res.socket.server.io = io;

  const onConnection = (socket: Socket) => {
    messageHandler(socket);
  };

  // Define actions inside
  io.on('connection', onConnection);

  res.end();
}
