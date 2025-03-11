import { hasAccessToSpace } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { CreateCredentialTemplateInput } from '@packages/credentials/templates';
import {
  createCredentialTemplate,
  getCredentialTemplates,
  updateCredentialTemplate
} from '@packages/credentials/templates';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { AdministratorOnlyError } from '@packages/users/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getCredentialsController)
  .use(requireUser)
  .post(
    requireSpaceMembership({ adminOnly: true, spaceIdKey: 'spaceId', location: 'body' }),
    createCredentialController
  )
  .put(updateCredentialController)
  .delete(deleteCredentialController);

async function getCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const credentials = await getCredentialTemplates({ spaceId: req.query.spaceId as string });
  return res.status(200).json(credentials);
}

async function createCredentialController(req: NextApiRequest, res: NextApiResponse) {
  const credentialTemplate = await createCredentialTemplate({
    ...(req.body as CreateCredentialTemplateInput),
    spaceId: req.body.spaceId as string
  });
  trackUserAction('credential_template_created', {
    credentialTemplateId: credentialTemplate.id,
    spaceId: credentialTemplate.spaceId,
    userId: req.session.user.id
  });
  return res.status(201).json(credentialTemplate);
}

async function updateCredentialController(req: NextApiRequest, res: NextApiResponse) {
  const credentialTemplate = await prisma.credentialTemplate.findUniqueOrThrow({
    where: {
      id: req.query.templateId as string
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  const { spaceRole } = await hasAccessToSpace({
    spaceId: credentialTemplate.spaceId,
    userId: req.session.user.id
  });

  if (!spaceRole?.isAdmin) {
    throw new AdministratorOnlyError();
  }

  await updateCredentialTemplate({ templateId: credentialTemplate.id, fields: req.body });

  trackUserAction('credential_template_updated', {
    credentialTemplateId: credentialTemplate.id,
    spaceId: credentialTemplate.spaceId,
    userId: req.session.user.id
  });

  return res.status(200).json({ success: true });
}

async function deleteCredentialController(req: NextApiRequest, res: NextApiResponse) {
  const credentialTemplate = await prisma.credentialTemplate.findUniqueOrThrow({
    where: {
      id: req.query.templateId as string
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  const { spaceRole } = await hasAccessToSpace({
    spaceId: credentialTemplate.spaceId,
    userId: req.session.user.id
  });

  if (!spaceRole?.isAdmin) {
    throw new AdministratorOnlyError();
  }

  await prisma.credentialTemplate.delete({
    where: {
      id: credentialTemplate.id
    }
  });

  trackUserAction('credential_template_deleted', {
    credentialTemplateId: credentialTemplate.id,
    spaceId: credentialTemplate.spaceId,
    userId: req.session.user.id
  });

  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
