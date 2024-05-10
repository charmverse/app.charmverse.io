import { log } from '@charmverse/core/log';
import type { PageType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { permissionsApiClient } from 'lib/permissions/api/client';
import type { CreateDraftProposalInput, ProposalContentType } from 'lib/proposals/createDraftProposal';
import { createDraftProposal } from 'lib/proposals/createDraftProposal';
import { withSessionSsr } from 'lib/session/withSession';
import { customConditionJoinSpace } from 'lib/spaces/customConditionJoinSpace';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { getPagePath } from 'lib/utils/domains/getPagePath';

export const getServerSideProps = withSessionSsr(async (context) => {
  const template = context.query?.template as string | undefined;
  const pageType = context.query.type as PageType | undefined;
  const sourcePageId = context.query.sourcePageId as string | undefined;
  const sourcePostId = context.query.sourcePostId as string | undefined;
  const contentType = context.query.contentType as ProposalContentType;
  const sessionUserId = context.req.session?.user?.id;

  // retrieve space by domain, and then last page view by spaceId
  const domainOrCustomDomain = context.query.domain as string;
  const space = await prisma.space.findFirstOrThrow({
    where: {
      OR: [
        {
          customDomain: domainOrCustomDomain
        },
        { domain: domainOrCustomDomain }
      ]
    },
    select: {
      id: true,
      domain: true,
      publicProposalTemplates: true
    }
  });

  const newDraftParams: CreateDraftProposalInput = {
    createdBy: sessionUserId,
    spaceId: space.id,
    templateId: template,
    contentType,
    pageType: pageType === 'proposal_template' ? pageType : undefined,
    sourcePageId,
    sourcePostId
  };

  const { success: isMember, isAdmin } = await hasAccessToSpace({
    userId: sessionUserId,
    spaceId: space.id
  });

  if (!isAdmin && pageType === 'proposal_template') {
    log.warn("User is not an admin and can't create a proposal from a template", {
      userId: sessionUserId
    });
    return {
      notFound: true
    };
  }

  // User is a member, early exit
  if (isMember) {
    const computedPermissions = await permissionsApiClient.spaces.computeSpacePermissions({
      resourceId: space.id,
      userId: sessionUserId
    });
    if (!computedPermissions.createProposals) {
      log.warn('User is a member but does not have permission to create proposals', {
        userId: sessionUserId,
        spaceId: space.id
      });
      return {
        notFound: true
      };
    }
    const proposal = await createDraftProposal(newDraftParams);
    return {
      redirect: {
        destination: getPagePath({
          hostName: context.req.headers.host,
          path: proposal.page.path,
          spaceDomain: space.domain
        }),
        permanent: false
      }
    };
  }

  // User is not a member, but space has not enabled public templates. Join via normal route
  if (!space.publicProposalTemplates || !template) {
    return {
      redirect: {
        destination: `/join?domain=${space.domain}`,
        permanent: false
      }
    };
  }

  if (!sessionUserId) {
    return {
      redirect: {
        destination: `/?returnUrl=${context.resolvedUrl}`,
        permanent: false
      }
    };
  }

  try {
    await customConditionJoinSpace({
      userId: sessionUserId,
      spaceId: space.id,
      params: { proposalTemplate: template as string }
    });
    const computedPermissions = await permissionsApiClient.spaces.computeSpacePermissions({
      resourceId: space.id,
      userId: sessionUserId
    });

    if (!computedPermissions.createProposals) {
      log.warn('User does not have permission to create proposals', {
        userId: sessionUserId,
        spaceId: space.id
      });
      return {
        notFound: true
      };
    }
    const proposal = await createDraftProposal(newDraftParams);
    return {
      redirect: {
        destination: getPagePath({
          hostName: context.req.headers.host,
          path: proposal.page.path,
          spaceDomain: space.domain,
          query: { reload: '1' }
        }),
        permanent: false
      }
    };
  } catch (err) {
    log.warn('User could not join space via template', {
      template,
      userId: sessionUserId,
      spaceId: space.id,
      err
    });

    return {
      redirect: {
        destination: `/join?domain=${space.domain}`,
        permanent: false
      }
    };
  }
});

// user will never see this page and instead be redirected somewhere else
export default function PageView() {
  return null;
}
