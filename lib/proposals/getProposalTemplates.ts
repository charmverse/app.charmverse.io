import { InvalidInputError } from '@charmverse/core/errors';
import type { SpaceResourcesRequest } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

export type ProposalTemplateMeta = {
  pageId: string;
  proposalId: string;
  contentType: 'free_form' | 'structured';
  title: string;
  archived?: boolean;
  draft?: boolean;
};

export async function getProposalTemplates({
  spaceId,
  userId
}: SpaceResourcesRequest): Promise<ProposalTemplateMeta[]> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`SpaceID is required`);
  }

  const { spaceRole, isAdmin } = await hasAccessToSpace({
    spaceId,
    userId
  });

  if (!spaceRole) {
    return [];
  }

  const templates = await prisma.page.findMany({
    where: {
      spaceId,
      type: 'proposal_template',
      deletedAt: null
    },
    select: {
      id: true,
      title: true,
      proposal: {
        select: {
          id: true,
          archived: true,
          formId: true,
          status: true
        }
      }
    }
  });

  const res: ProposalTemplateMeta[] = templates.map((page) => ({
    pageId: page.id,
    proposalId: page.proposal!.id,
    contentType: page.proposal!.formId ? 'structured' : 'free_form',
    title: page.title,
    archived: page.proposal?.archived || undefined,
    draft: page.proposal?.status === 'draft'
  }));

  if (!isAdmin) {
    return res.filter((template) => !template.archived && !template.draft);
  }

  return res;
}
