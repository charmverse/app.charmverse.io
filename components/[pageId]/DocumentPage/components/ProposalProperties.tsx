import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { ProposalStatus } from '@charmverse/core/prisma';

import charmClient from 'charmClient';
import { useTasks } from 'components/nexus/hooks/useTasks';
import type { ProposalFormInputs } from 'components/proposals/components/ProposalProperties/ProposalProperties';
import { ProposalProperties as ProposalPropertiesBase } from 'components/proposals/components/ProposalProperties/ProposalProperties';
import { useProposalDetails } from 'components/proposals/hooks/useProposalDetails';
import { useProposalFlowFlags } from 'components/proposals/hooks/useProposalFlowFlags';
import { useProposalPermissions } from 'components/proposals/hooks/useProposalPermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';

interface ProposalPropertiesProps {
  readOnly?: boolean;
  pageId: string;
  proposalId: string;
  snapshotProposalId: string | null;
  isTemplate: boolean;
  pagePermissions?: PagePermissionFlags;
  refreshPagePermissions?: () => void;
}

export function ProposalProperties({
  pagePermissions,
  refreshPagePermissions = () => null,
  pageId,
  proposalId,
  snapshotProposalId,
  readOnly,
  isTemplate
}: ProposalPropertiesProps) {
  const { proposal, refreshProposal } = useProposalDetails(proposalId);
  const { mutate: mutateTasks } = useTasks();

  const { permissions: proposalPermissions, refresh: refreshProposalPermissions } = useProposalPermissions({
    proposalIdOrPath: proposalId
  });

  const { permissions: proposalFlowFlags, refresh: refreshProposalFlowFlags } = useProposalFlowFlags({ proposalId });
  const isAdmin = useIsAdmin();

  const canUpdateProposalProperties = pagePermissions?.edit_content || isAdmin;

  const proposalFormInputs: ProposalFormInputs = {
    categoryId: proposal?.categoryId,
    evaluationType: proposal?.evaluationType || 'vote',
    authors: proposal?.authors.map((author) => author.userId) ?? [],
    rubricCriteria: proposal?.rubricCriteria ?? [],
    reviewers:
      proposal?.reviewers.map((reviewer) => ({
        group: reviewer.roleId ? 'role' : 'user',
        id: reviewer.roleId ?? (reviewer.userId as string)
      })) ?? []
  };

  async function updateProposalStatus(newStatus: ProposalStatus) {
    if (proposal && newStatus !== proposal.status) {
      await charmClient.proposals.updateStatus(proposal.id, newStatus);
      await Promise.all([
        refreshProposal(),
        refreshProposalFlowFlags(),
        refreshPagePermissions(),
        refreshProposalPermissions()
      ]);
      mutateTasks();
    }
  }

  async function onChangeProperties(values: ProposalFormInputs) {
    await charmClient.proposals.updateProposal({
      proposalId,
      ...values
    });
    refreshProposal();
    refreshProposalFlowFlags(); // needs to run when reviewers change?
  }

  return (
    <ProposalPropertiesBase
      archived={!!proposal?.archived}
      canUpdateProposalProperties={canUpdateProposalProperties}
      disabledCategoryInput={!proposalPermissions?.edit}
      isTemplate={isTemplate}
      proposalFlowFlags={proposalFlowFlags}
      proposalStatus={proposal?.status}
      proposalId={proposal?.id}
      pageId={pageId}
      readOnly={readOnly}
      snapshotProposalId={snapshotProposalId}
      updateProposalStatus={updateProposalStatus}
      proposalFormInputs={proposalFormInputs}
      setProposalFormInputs={onChangeProperties}
    />
  );
}
