import type { RequestContext, SessionData } from './interfaces';

export async function saveSession(ctx: RequestContext, session: SessionData) {
  Object.assign(ctx.session, {
    anonymousUserId: session.anonymousUserId,
    scoutId: session.scoutId
  });
  await ctx.session.save();
}
