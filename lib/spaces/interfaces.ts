import { Space } from '@prisma/client';

export type PublicSpaceInfo = Pick<Space, 'domain' | 'id'>
