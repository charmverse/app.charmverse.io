import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import getPageLayout from 'components/common/PageLayout/getLayout';
import type { ProposalPageAndPropertiesInput } from 'components/proposals/ProposalPage/NewProposalPage';
import { NewProposalPage } from 'components/proposals/ProposalPage/NewProposalPage';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { withSessionSsr } from 'lib/session/withSession';
import { customConditionJoinSpace } from 'lib/spaces/customConditionJoinSpace';

export const getServerSideProps = withSessionSsr(async (context) => {
  const template = context.query?.template;

  // retrieve space by domain, and then last page view by spaceId
  const domainOrCustomDomain = context.query.domain as string;
  const sessionUserId = context.req.session?.user?.id;
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

    return {
      props: {
        reload: true
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

export default function PageView({ reload }: { reload?: boolean }) {
  const router = useRouter();
  const isTemplate = router.query.type === 'proposal_template';
  const selectedTemplate = router.query.template as string | undefined;
  const sourcePageId = router.query.sourcePageId as string | undefined;
  const sourcePostId = router.query.sourcePostId as string | undefined;
  const proposalType = router.query.proposalType as ProposalPageAndPropertiesInput['proposalType'];

  const { isSpaceMember } = useIsSpaceMember();

  useEffect(() => {
    if (reload) {
      window.location.reload();
    }
  }, [reload]);

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
