import type { PagePermissionFlags } from '@charmverse/core/permissions';
import { Box } from '@mui/material';

import { useUpdateProposal } from 'charmClient/hooks/proposals';
import { useProposalTemplateById } from 'components/proposals/hooks/useProposalTemplates';
import type { ProposalPropertiesInput } from 'components/proposals/ProposalPage/components/ProposalProperties/ProposalPropertiesBase';
import { ProposalPropertiesBase } from 'components/proposals/ProposalPage/components/ProposalProperties/ProposalPropertiesBase';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { PageWithContent } from 'lib/pages';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

interface ProposalPropertiesProps {
  readOnly?: boolean;
  pageId: string;
  proposalId: string;
  proposalPage: PageWithContent;
  proposal?: ProposalWithUsersAndRubric;
  refreshProposal: VoidFunction;
}

export function ProposalProperties({
  pageId,
  proposalId,
  readOnly,
  proposalPage,
  proposal,
  refreshProposal
}: ProposalPropertiesProps) {
  const { trigger: updateProposal } = useUpdateProposal({ proposalId });
  const { user } = useUser();

  const sourceTemplate = useProposalTemplateById(proposal?.page?.sourceTemplateId);

  const isAdmin = useIsAdmin();

  // further restrict readOnly if user cannot update proposal properties specifically
  const readOnlyProperties = readOnly || !proposal?.permissions.edit;
  const readOnlySelectedCredentialTemplates =
    readOnly || !proposal?.permissions.edit || (sourceTemplate?.selectedCredentialTemplates && !isAdmin);

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
    type: proposalPage.type,
    fields: typeof proposal?.fields === 'object' && !!proposal?.fields ? proposal.fields : { properties: {} },
    selectedCredentialTemplates: proposal?.selectedCredentialTemplates
  };

  async function onChangeProperties(values: Partial<ProposalPropertiesInput>) {
    await updateProposal(values);
    refreshProposal();
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
          proposalStatus={proposal?.status}
          pageId={pageId}
          proposalId={proposalId}
          readOnlyAuthors={readOnlyProperties ?? !!sourceTemplate?.authors.length}
          proposalFormInputs={proposalFormInputs}
          setProposalFormInputs={onChangeProperties}
          readOnlyCustomProperties={readOnlyCustomProperties}
          rewardIds={proposal?.rewardIds}
          readOnlySelectedCredentialTemplates={readOnlySelectedCredentialTemplates}
        />
      </div>
    </Box>
  );
}
