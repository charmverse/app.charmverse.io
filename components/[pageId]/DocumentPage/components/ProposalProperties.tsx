import type { PagePermissionFlags } from '@charmverse/core/permissions';
import { Box } from '@mui/material';
import { useState } from 'react';

import { useGetIsReviewer, useUpdateProposal } from 'charmClient/hooks/proposals';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useProposalTemplateById } from 'components/proposals/hooks/useProposalTemplates';
import type { ProposalPropertiesInput } from 'components/proposals/ProposalPage/components/ProposalProperties/ProposalPropertiesBase';
import { ProposalPropertiesBase } from 'components/proposals/ProposalPage/components/ProposalProperties/ProposalPropertiesBase';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { PageWithContent } from 'lib/pages';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { CreateLensPublication } from './CreateLensPublication';

interface ProposalPropertiesProps {
  readOnly?: boolean;
  pageId: string;
  proposalId: string;
  pagePermissions?: PagePermissionFlags;
  proposalPage: PageWithContent;
  proposal?: ProposalWithUsersAndRubric;
  refreshProposal: VoidFunction;
}

export function ProposalProperties({
  pagePermissions,
  pageId,
  proposalId,
  readOnly,
  proposalPage,
  proposal,
  refreshProposal
}: ProposalPropertiesProps) {
  const { trigger: updateProposal } = useUpdateProposal({ proposalId });
  const { user } = useUser();
  const [isPublishingToLens, setIsPublishingToLens] = useState(false);
  const { mutateProposals } = useProposals();

  const sourceTemplate = useProposalTemplateById(proposal?.page?.sourceTemplateId);

  const { data: isReviewer } = useGetIsReviewer(pageId || undefined);
  const isAdmin = useIsAdmin();

  // further restrict readOnly if user cannot update proposal properties specifically
  const readOnlyProperties = readOnly || !(pagePermissions?.edit_content || isAdmin);

  // properties with values from templates should be read only
  const readOnlyCustomProperties =
    !isAdmin && sourceTemplate?.fields
      ? Object.entries(sourceTemplate?.fields?.properties || {})?.reduce((acc, [key, value]) => {
          if (!value) {
            return acc;
          }

          acc.push(key);
          return acc;
        }, [] as string[])
      : [];

  const proposalFormInputs: ProposalPropertiesInput = {
    archived: proposal?.archived ?? false,
    authors: proposal?.authors.map((author) => author.userId) ?? [],
    evaluations: proposal?.evaluations ?? [],
    publishToLens: proposal ? proposal.publishToLens ?? false : !!user?.publishToLensDefault,
    reviewers:
      proposal?.reviewers.map((reviewer) => ({
        group: reviewer.roleId ? 'role' : 'user',
        id: reviewer.roleId ?? (reviewer.userId as string)
      })) ?? [],
    type: proposalPage.type,
    fields: typeof proposal?.fields === 'object' && !!proposal?.fields ? proposal.fields : { properties: {} },
    selectedCredentialTemplates: proposal?.selectedCredentialTemplates
  };

  async function onChangeProperties(values: Partial<ProposalPropertiesInput>) {
    await updateProposal(values);
    refreshProposal();
    mutateProposals();
  }

  return (
    <Box
      className='CardDetail content'
      sx={{
        '.octo-propertyname .Button': {
          paddingLeft: 0
        }
      }}
      mt={2}
    >
      <div className='octo-propertylist'>
        <ProposalPropertiesBase
          proposalLensLink={proposal?.lensPostLink ?? undefined}
          proposalStatus={proposal?.status}
          pageId={pageId}
          proposalId={proposalId}
          readOnlyAuthors={readOnlyProperties}
          proposalFormInputs={proposalFormInputs}
          setProposalFormInputs={onChangeProperties}
          isPublishingToLens={isPublishingToLens}
          readOnlyCustomProperties={readOnlyCustomProperties}
          isReviewer={isReviewer}
          rewardIds={proposal?.rewardIds}
        />
        {isPublishingToLens && (
          <CreateLensPublication
            onError={() => {
              setIsPublishingToLens(false);
            }}
            publicationType='post'
            content={proposalPage.content as PageContent}
            proposalId={proposalId}
            proposalPath={proposalPage.path}
            onSuccess={async () => {
              await refreshProposal();
              setIsPublishingToLens(false);
            }}
            proposalTitle={proposalPage.title}
          />
        )}
      </div>
    </Box>
  );
}
