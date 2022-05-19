import { Bounty, Prisma } from '@prisma/client';

export type BountyCreationData = Pick<Bounty, 'title' | 'spaceId' | 'createdBy'> & Partial<Bounty>
