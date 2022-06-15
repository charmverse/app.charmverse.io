import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { MarkMentionTask, markMentionedTasks } from 'lib/mentions/markMentionedTasks';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(markMentions);

async function markMentions (req: NextApiRequest, res: NextApiResponse<{ok: boolean}>) {
  const mentions = req.body as MarkMentionTask[];
  await markMentionedTasks(mentions, req.session.user.id);
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
