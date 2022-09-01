
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getCredentials, CredentialsResult } from 'lib/collabland';
import log from 'lib/log';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(requireKeys(['aeToken'], 'body'), importCredentials);

async function importCredentials (req: NextApiRequest, res: NextApiResponse<CredentialsResult>) {

  const credentials = await getCredentials({
    aeToken: req.body.aeToken
  });

  log.info('Received request to import Collab.land');

  return res.status(200).json(credentials);
}

export default withSessionRoute(handler);
