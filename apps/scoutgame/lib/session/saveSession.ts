import type { RequestContext, SessionData } from './interfaces';

export async function saveSession(ctx: RequestContext, session: SessionData) {
  Object.assign(ctx.session, {
    anonymousUserId: session.anonymousUserId,
    user: session.user
      ? {
          id: session.user.id
        }
      : undefined
  });
  await ctx.session.save();
}
