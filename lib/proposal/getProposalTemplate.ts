import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';

import type { permissionsApiClient } from 'lib/permissions/api/client';

import type { ProposalWithUsersAndRubric } from './interface';
import { mapDbProposalToProposal } from './mapDbProposalToProposal';

const mockPermissions: ProposalPermissionFlags = {
  evaluate: true,
  comment: true,
  edit: true,
  delete: true,
  view: false,
  view_notes: false,
  view_private_fields: true,
  create_vote: false,
  make_public: false,
  archive: false,
  unarchive: false,
  move: false
};

export async function getProposalTemplate({ pageId }: { pageId: string }): Promise<ProposalWithUsersAndRubric> {
  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: {
        id: pageId
      }
    },
    include: {
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        include: {
          permissions: true,
          reviewers: true,
          rubricCriteria: {
            orderBy: {
              index: 'asc'
            }
          },
          rubricAnswers: true,
          draftRubricAnswers: true,
          vote: true
        }
      },
      authors: true,
      page: { select: { id: true, content: true, contentText: true, sourceTemplateId: true, type: true } },
      rewards: true,
      form: {
        include: {
          formFields: {
            orderBy: {
              index: 'asc'
            }
          }
        }
      }
    }
  });

  return mapDbProposalToProposal({
    proposal,
    permissions: mockPermissions
  });
}
