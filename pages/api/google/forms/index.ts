import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getCredential } from 'lib/google/forms/credentials';
// import type { GoogleForm } from 'lib/google/forms/forms';
import { getForms } from 'lib/google/forms/forms';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

export type GetFormsRequest = {
  credentialId: string;
};

export type GoogleFormItem = {
  id: string;
  name: string;
};

handler.use(requireUser).get(getFormsResponse);

async function getFormsResponse(req: NextApiRequest, res: NextApiResponse) {
  const credentialId = req.query.credentialId;

  if (typeof credentialId !== 'string') {
    throw new InvalidInputError('Credential id is required');
  }

  const Credential = await getCredential({ credentialId });
  const { files } = await getForms(Credential);

  const result = (files ?? []).map(
    (form): GoogleFormItem => ({
      id: form.id as string,
      name: form.name ?? 'Untitled'
    })
  );

  res.send(result);
}

export default withSessionRoute(handler);
