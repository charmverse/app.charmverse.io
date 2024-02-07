import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';

import getPageLayout from 'components/common/PageLayout/getLayout';
import type { ProposalPageAndPropertiesInput } from 'components/proposals/ProposalPage/NewProposalPage';
import { NewProposalPage } from 'components/proposals/ProposalPage/NewProposalPage';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { withSessionSsr } from 'lib/session/withSession';
import { customConditionJoinSpace } from 'lib/spaces/customConditionJoinSpace';
import { getPagePath } from 'lib/utilities/domains/getPagePath';

export const getServerSideProps: GetServerSideProps = withSessionSsr(async (context: GetServerSidePropsContext) => {
  const template = context.query?.template;

  const customDomain = context.req.headers.host;

  const spaceDomainFromPath = context.params?.domain;

  const domainToUse = (spaceDomainFromPath ?? customDomain) as string | undefined;

  const sessionUserId = context.req.session?.user?.id;

  /**
   - Template
    -- isLoggedIn
    -- notLoggedIn
    - isSpaceMember
    - notIsMember

  - No Template
    -- isLoggedIn
    --- isSpaceMember
   */
  // Template

  // No template

  if (!domainToUse) {
    return {
      redirect: {
        destination: `/`,
        permanent: false
      }
    };
  }

  const space = await prisma.space.findFirst({
    where: spaceDomainFromPath ? { domain: domainToUse } : { customDomain: domainToUse, isCustomDomainVerified: true },
    select: {
      id: true,
      publicProposalTemplates: true
    }
  });

  const spaceRole =
    sessionUserId && space
      ? await prisma.spaceRole.findFirst({
          where: {
            userId: sessionUserId,
            spaceId: space.id
          }
        })
      : null;

  // User is a member, early exit
  if (spaceRole) {
    return {
      props: {}
    };
  }

  // User is not a member, but space has not enabled public templates. Join via normal route
  if (!space?.publicProposalTemplates || !template) {
    return {
      redirect: {
        destination: `/join?domain=${domainToUse}`,
        permanent: false
      }
    };
  }

  if (!sessionUserId) {
    return {
      redirect: {
        destination: `/?redirectUrl=${getPagePath({
          path: '/',
          spaceDomain: domainToUse,
          hostName: context.req.headers.host,
          query: context.query
        })}`,
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

    return {
      props: {
        reload: true
      }
    };
  } catch (err) {
    log.error('User could not join space via template', {
      template,
      userId: sessionUserId,
      spaceId: space.id,
      err
    });

    return {
      redirect: {
        destination: `/join?domain=${domainToUse}`,
        permanent: false
      }
    };
  }
});

export default function PageView() {
  const router = useRouter();
  const isTemplate = router.query.type === 'proposal_template';
  const selectedTemplate = router.query.template as string | undefined;
  const sourcePageId = router.query.sourcePageId as string | undefined;
  const sourcePostId = router.query.sourcePostId as string | undefined;
  const proposalType = router.query.proposalType as ProposalPageAndPropertiesInput['proposalType'];

  const { isSpaceMember } = useIsSpaceMember();

  if (!isSpaceMember) {
    return null;
  }

  return (
    <NewProposalPage
      proposalType={proposalType}
      templateId={selectedTemplate}
      sourcePageId={sourcePageId}
      sourcePostId={sourcePostId}
      isTemplate={isTemplate}
    />
  );
}

PageView.getLayout = getPageLayout;
