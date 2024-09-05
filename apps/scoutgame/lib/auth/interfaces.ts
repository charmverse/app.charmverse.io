import type { Scout } from '@charmverse/core/prisma-client';

export type LoggedInUser = Pick<Scout, 'id' | 'displayName' | 'username' | 'avatar' | 'builder'>;
