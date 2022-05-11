import { NextApiRequest, NextApiResponse } from 'next';
import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';
import { findOrCreateRoles } from 'lib/roles/createRoles';
import { GetGuildByIdResponse, guild } from '@guildxyz/sdk';

const handler = nc({
  onError,
  onNoMatch
});

export interface ImportGuildRolesPayload {
  spaceId: string,
  guildIds: number[],
}

async function importRoles (req: NextApiRequest, res: NextApiResponse<{ok: boolean} | { error: string }>) {
  const { spaceId, guildIds } = req.body as ImportGuildRolesPayload;
  const guilds: GetGuildByIdResponse[] = await Promise.all(guildIds.map(guildId => guild.get(guildId)));
  const guildRoles: {id: number, name: string}[] = [];
  guilds.forEach(_guild => {
    guildRoles.push(..._guild.roles.map(role => ({ id: role.id, name: role.name })));
  });
  await findOrCreateRoles(guildRoles, spaceId, req.session.user.id);

  res.status(200).json({ ok: true });
}

handler.use(requireUser).use(requireKeys(['spaceId', 'guildIds'], 'body')).use(requireSpaceMembership({ adminOnly: true })).post(importRoles);

export default withSessionRoute(handler);
