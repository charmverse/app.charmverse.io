import { prisma } from '@charmverse/core/prisma-client';

import { InvalidStateError } from 'lib/middleware';
import type { ProposalFields } from 'lib/proposal/interface';

export type UpdateProposalRequest = {
  proposalId: string;
  authors?: string[];
  publishToLens?: boolean;
  fields?: ProposalFields | null;
  credentialTemplateId?: string;
};

export async function updateProposal({
  proposalId,
  authors,
  publishToLens,
  fields,
  credentialTemplateId
}: UpdateProposalRequest) {
  if (authors && authors.length === 0) {
    throw new InvalidStateError('Proposal must have at least 1 author');
  }

  await prisma.$transaction(async (tx) => {
    if (typeof publishToLens === 'boolean') {
      await tx.proposal.update({
        where: {
          id: proposalId
        },
        data: {
          publishToLens
        }
      });
    }

    const updatingCredentialTemplate = typeof credentialTemplateId === 'string' || credentialTemplateId === null;

    if (updatingCredentialTemplate) {
      await tx.proposal.update({
        where: {
          id: proposalId
        },
        data: {
          credentialTemplate:
            credentialTemplateId === '' || credentialTemplateId === null
              ? { disconnect: {} }
              : { connect: { id: credentialTemplateId } }
        }
      });
    }

    // Update fields only when it is present in request payload
    if (fields) {
      await tx.proposal.update({
        where: {
          id: proposalId
        },
        data: {
          fields
        }
      });
    }

    // update authors only when it is present in request payload
    if (authors) {
      await tx.proposalAuthor.deleteMany({
        where: {
          proposalId
        }
      });
      await tx.proposalAuthor.createMany({
        data: authors.map((author) => ({ proposalId, userId: author }))
      });
    }
  });
}
