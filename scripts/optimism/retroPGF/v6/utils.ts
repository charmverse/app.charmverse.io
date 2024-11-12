import { prisma } from '@charmverse/core/prisma-client';
import { spaceId, RetroApplication, fieldIds } from './data';

import { _, jsonDoc } from 'lib/prosemirror/builders';
import { templateId } from './data';
export function getProposals() {
  return prisma.page.findMany({
    where: {
      spaceId,
      type: 'proposal',
      proposal: {
        archived: false
      },
      sourceTemplateId: templateId
    },
    include: {
      proposal: {
        include: {
          evaluations: {
            include: {
              reviews: {
                include: {
                  reviewer: true
                }
              },
              appealReviews: {
                include: {
                  reviewer: true
                }
              },
              appealReviewers: true,
              reviewers: true
            }
          },
          formAnswers: true
        }
      }
    }
  });
}

export type DatabaseProposals = Awaited<ReturnType<typeof getProposals>>;
export type DatabaseProposal = DatabaseProposals[number];

export function findProposalMatch(attestationId: string, proposals: DatabaseProposals) {
  return proposals.find(
    (r) => r.proposal?.formAnswers.find((a) => a.fieldId === fieldIds['Attestation ID'])?.value === attestationId
  );
}

export function charmValue(value?: string | null) {
  return {
    content: jsonDoc(_.p(value || '')),
    contentText: value || ''
  };
}

export function charmValues(values: string[]) {
  return {
    content: jsonDoc(...values.map((str) => _.p(str))),
    contentText: values.join('\n')
  };
}

export function charmLinks(links: { url: string; name?: string }[]) {
  return {
    content: jsonDoc(...links.map(({ url, name }) => _.p(_.link({ href: url }, name || url)))),
    contentText: links.map((w) => w.url).join('\n')
  };
}
