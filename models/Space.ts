import type { Space } from '@prisma/client';

export { Space };

export const DOMAIN_BLACKLIST = ['api', 'invite', 'login', 'signup', 'createWorkspace', 'share'];
