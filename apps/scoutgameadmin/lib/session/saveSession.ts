import type { RequestContext, SessionData } from './interfaces';

export async function saveSession(ctx: RequestContext, session: SessionData) {
  Object.assign(ctx.session, {
    adminId: session.adminId
  });
  await ctx.session.save();
}
