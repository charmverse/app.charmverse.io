import { log } from '@charmverse/core/log';
import type { PageType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';

import ErrorPage from 'components/common/errors/ErrorPage';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { CreateDraftProposalInput, ProposalContentType } from 'lib/proposals/createDraftProposal';
import { createDraftProposal } from 'lib/proposals/createDraftProposal';
import { withSessionSsr } from 'lib/session/withSession';
import { customConditionJoinSpace } from 'lib/spaces/customConditionJoinSpace';
import { getPagePath } from 'lib/utils/domains/getPagePath';

export const getServerSideProps = withSessionSsr<{ error?: string }>(async (context) => {
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
      publicProposalTemplates: true,
      requireProposalTemplate: true
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
    if (space.requireProposalTemplate && !template && pageType !== 'proposal_template') {
      log.warn('User is a member but space requires a template to create proposals', { spaceId: space.id });

      return {
        props: { error: 'You must select a template to create a proposal' }
      };
    }
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
        props: { error: 'You do not have permission to create a proposal' }
      };
    }
    if (sourcePageId) {
      const sourcePagePermissions = await permissionsApiClient.pages.computePagePermissions({
        resourceId: sourcePageId,
        userId: sessionUserId
      });
      if (!sourcePagePermissions.edit_content) {
        log.warn('User does not have permission to create proposal from page', {
          userId: sessionUserId,
          pageId: sourcePageId
        });
        return {
          props: { error: 'You do not have permission to convert this to a proposal' }
        };
      }
    }
    try {
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
    } catch (error) {
      log.error('Failed to create draft proposal', {
        error,
        query: context.query,
        userId: sessionUserId,
        spaceId: space.id
      });
      return {
        props: { error: 'The selected template is invalid' }
      };
    }
  }

  if (space.requireProposalTemplate && !template) {
    log.warn('Space requires a template to create proposals', { spaceId: space.id });

    return { notFound: true };
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
  } catch (error) {
    log.warn('User could not join space via template', {
      template,
      userId: sessionUserId,
      spaceId: space.id,
      error
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
export default function PageView({ error }: { error?: string }) {
  if (error) {
    return <ErrorPage message={error} />;
  }
  return null;
}
