import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';

import { redisClient } from '@root/adapters/redis/redisClient';
async function query() {
  await redisClient?.connect();
}

query();
