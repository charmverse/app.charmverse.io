import type { GetGuildByIdResponse } from '@guildxyz/sdk';
import { guild } from '@guildxyz/sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateGuildRolesForSpace } from 'lib/guild-xyz/server/updateGuildRolesForSpace';
import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { findOrCreateRoles } from 'lib/roles/createRoles';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc({
  onError,
  onNoMatch
});

export interface ImportGuildRolesPayload {
  spaceId: string;
  guildIds: number[];
}

async function importRoles (req: NextApiRequest, res: NextApiResponse<{ importedRolesCount: number } | { error: string }>) {
  const { spaceId, guildIds } = req.body as ImportGuildRolesPayload;
  const guilds: GetGuildByIdResponse[] = await Promise.all(guildIds.map(guildId => guild.get(guildId)));
  const guildRoles: { id: number, name: string }[] = [];
  guilds.forEach(_guild => {
    guildRoles.push(..._guild.roles.map(role => ({ id: role.id, name: role.name })));
  });
  await findOrCreateRoles(guildRoles, spaceId, req.session.user.id, { source: 'guild_xyz' });
  await updateGuildRolesForSpace(spaceId);
  res.status(200).json({ importedRolesCount: Object.keys(guildRoles).length });
}

handler.use(requireUser).use(requireKeys(['spaceId', 'guildIds'], 'body')).use(requireSpaceMembership({ adminOnly: true })).post(importRoles);

export default withSessionRoute(handler);
