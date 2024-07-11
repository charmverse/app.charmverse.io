import { Server } from 'socket.io';

import { redisClient } from '@root/adapters/redis/redisClient';

import { config } from './config';
import type { ServerMessage } from './interfaces';

const io = new Server(config);

export function broadcastToSpace(message: ServerMessage, spaceId: string) {
  return io.to(spaceId).emit('message', message);
}
