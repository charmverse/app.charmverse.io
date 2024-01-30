import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';

import getPageLayout from 'components/common/PageLayout/getLayout';
import type { ProposalPageAndPropertiesInput } from 'components/proposals/ProposalPage/NewProposalPage';
import { NewProposalPage } from 'components/proposals/ProposalPage/NewProposalPage';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { withSessionSsr } from 'lib/session/withSession';
import { customConditionJoinSpace } from 'lib/spaces/customConditionJoinSpace';

export const getServerSideProps = withSessionSsr(async (ctx: GetServerSidePropsContext) => {
  const { template } = ctx.query ?? {};

  const customDomain = ctx.req.headers.host;

  const spaceDomainFromPath = ctx.params?.domain;

  const domainToUse = (spaceDomainFromPath ?? customDomain) as string | undefined;

  const userId = ctx.req.session?.user?.id;

  if (userId && domainToUse && template) {
    const space = await prisma.space.findFirst({
      where: spaceDomainFromPath ? { domain: domainToUse } : { customDomain: domainToUse, isCustomDomainVerified: true }
    });

    if (space) {
      const spaceRole = await prisma.spaceRole.findFirst({
        where: {
          userId,
          spaceId: space.id
        }
      });

      if (!spaceRole) {
        await customConditionJoinSpace({
          userId,
          spaceId: space.id,
          params: { proposalTemplate: template as string }
        }).catch((err) => {
          log.error('User could not join space via template', { template, userId, spaceId: space.id, err });
        });
      }
    }
  }

  return {
    props: {}
  };
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
