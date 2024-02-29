import type { FormField } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { FormFieldInput } from 'components/common/form/interfaces';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { upsertProposalFormFields } from 'lib/proposals/form/upsertProposalFormFields';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(upsertProposalFormController);

async function upsertProposalFormController(req: NextApiRequest, res: NextApiResponse<FormField[]>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.edit) {
    throw new ActionNotPermittedError(`You can't update this proposal.`);
  }

  const { formFields } = req.body as { formFields: FormFieldInput[] };

  const updatedFormFields = await upsertProposalFormFields({
    proposalId,
    formFields
  });

  res.status(200).send(updatedFormFields);
}

export default withSessionRoute(handler);
