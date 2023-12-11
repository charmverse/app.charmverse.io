import { prisma } from '@charmverse/core/prisma-client';
import { Box } from '@mui/material';
import type { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { DocumentPageProviders } from 'components/[pageId]/DocumentPage/DocumentPageProviders';
import { EditorPage } from 'components/[pageId]/EditorPage/EditorPage';
import { SharedPage } from 'components/[pageId]/SharedPage/SharedPage';
import ErrorPage from 'components/common/errors/ErrorPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useNewProposal } from 'components/proposals/new/hooks/useNewProposal';
import type { NewProposalInput } from 'components/proposals/new/hooks/useNewProposal';
import { NewProposalPage } from 'components/proposals/new/NewProposalPage';
import type { ProposalPageAndPropertiesInput } from 'components/proposals/new/NewProposalPage';
import { useSpaceSubscription } from 'components/settings/subscription/hooks/useSpaceSubscription';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { usePageIdFromPath } from 'hooks/usePageFromPath';
import { useSharedPage } from 'hooks/useSharedPage';
import { useUser } from 'hooks/useUser';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import { getCustomDomainFromHost } from 'lib/utilities/domains/getCustomDomainFromHost';

export default function PageView() {
  const router = useRouter();
  const { proposalTemplates, isLoadingTemplates } = useProposalTemplates();
  const selectedTemplate = router.query.template as string;
  const proposalTemplate = proposalTemplates?.find((t) => t.id === selectedTemplate);
  const newProposal: NewProposalInput = proposalTemplate
    ? {
        contentText: proposalTemplate.page.contentText ?? '',
        content: proposalTemplate.page.content as any,
        proposalTemplateId: selectedTemplate,
        evaluationType: proposalTemplate.evaluationType,
        headerImage: proposalTemplate.page.headerImage,
        icon: proposalTemplate.page.icon,
        categoryId: proposalTemplate.categoryId as string,
        reviewers: proposalTemplate.reviewers.map((reviewer) => ({
          group: reviewer.roleId ? 'role' : 'user',
          id: (reviewer.roleId ?? reviewer.userId) as string
        })),
        rubricCriteria: proposalTemplate.rubricCriteria,
        fields: (proposalTemplate.fields as any) || {},
        type: 'proposal'
      }
    : null;

  const { formInputs, setFormInputs, clearFormInputs, contentUpdated, createProposal } = useNewProposal({
    newProposal
  });
  return (
    <DocumentPageProviders>
      <Box height='100%' sx={{ overflowY: 'auto' }}>
        <NewProposalPage formInputs={formInputs} setFormInputs={setFormInputs} contentUpdated={contentUpdated} />;
      </Box>
    </DocumentPageProviders>
  );
}

PageView.getLayout = getPageLayout;
