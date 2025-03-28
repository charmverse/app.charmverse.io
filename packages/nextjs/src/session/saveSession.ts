import type { NextApiRequest } from 'next';

/**
 * Embed user cookie inside the session
 */
export async function saveSession({ req, userId }: { req: NextApiRequest; userId: string }): Promise<void> {
  req.session.user = { id: userId };
  await req.session.save();
}
