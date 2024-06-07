import { InvalidInputError } from '@charmverse/core/errors';
import type { SpaceResourcesRequest } from '@charmverse/core/permissions';
import type { FormField, ProposalEvaluation } from '@charmverse/core/prisma-client';
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
  evaluations?: Pick<ProposalEvaluation, 'id' | 'type' | 'title'>[];
  formFields?: Pick<FormField, 'id' | 'type' | 'name'>[];
};

export async function getProposalTemplates({
  spaceId,
  userId,
  evaluationsAndFormFields
}: SpaceResourcesRequest & {
  evaluationsAndFormFields?: boolean;
}): Promise<ProposalTemplateMeta[]> {
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
          status: true,
          form: {
            select: {
              formFields: evaluationsAndFormFields
                ? {
                    orderBy: {
                      index: 'asc'
                    },
                    select: {
                      type: true,
                      id: true,
                      name: true
                    }
                  }
                : undefined
            }
          },
          evaluations: evaluationsAndFormFields
            ? {
                orderBy: {
                  index: 'asc'
                },
                select: {
                  id: true,
                  type: true,
                  title: true
                }
              }
            : undefined
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
    draft: page.proposal?.status === 'draft',
    evaluations: page.proposal?.evaluations ?? [],
    formFields: page.proposal?.form?.formFields ?? []
  }));

  if (!isAdmin) {
    return res.filter((template) => !template.archived && !template.draft);
  }

  return res;
}
