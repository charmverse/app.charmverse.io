import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { guild } from '@packages/lib/guild-xyz/client';
import { updateGuildRolesForSpace } from '@packages/lib/guild-xyz/server/updateGuildRolesForSpace';
import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { findOrCreateRoles } from '@packages/lib/roles/createRoles';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc({
  onError,
  onNoMatch
});

export interface ImportGuildRolesPayload {
  spaceId: string;
  guildIds: number[];
}

async function importRoles(
  req: NextApiRequest,
  res: NextApiResponse<{ importedRolesCount: number } | { error: string }>
) {
  const { spaceId, guildIds } = req.body as ImportGuildRolesPayload;
  const guilds = await guild.getMany(guildIds);
  const guildRoles: { id: number; name: string }[] = (
    await Promise.all(guilds.map((g) => guild.role.getAll(g.id)))
  ).flat();
  await findOrCreateRoles(guildRoles, spaceId, req.session.user.id, { source: 'guild_xyz' });
  await updateGuildRolesForSpace(spaceId);
  res.status(200).json({ importedRolesCount: Object.keys(guildRoles).length });
}

handler
  .use(requireUser)
  .use(requireKeys(['spaceId', 'guildIds'], 'body'))
  .use(requireSpaceMembership({ adminOnly: true }))
  .post(importRoles);

export default withSessionRoute(handler);
