import { log } from '@charmverse/core/log';
import { stringUtils } from '@charmverse/core/utilities';
import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { Chip, ListItemText, MenuItem } from '@mui/material';
import { useState } from 'react';

import { useProposalCredentials } from 'components/proposals/hooks/useProposalCredentials';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import type { IssuableProposalCredentialContent } from 'lib/credentials/findIssuableProposalCredentials';

import { PropertyMenu } from './PropertyMenu';

export function IssueProposalCredentials({ selectedPageIds }: { selectedPageIds: string[] }) {
  const { getFeatureTitle } = useSpaceFeatures();

  const { space } = useCurrentSpace();

  const proposalLabel = getFeatureTitle('Proposal');

  const { issuableProposalCredentials, issueAndSaveProposalCredentials } = useProposalCredentials();
  const { showMessage } = useSnackbar();

  const { all, proposalApproved, proposalCreated } = (issuableProposalCredentials ?? []).reduce(
    (acc, val) => {
      if (selectedPageIds?.some((id) => id === val.pageId)) {
        acc.all.push(val);
        if (val.event === 'proposal_created') {
          acc.proposalCreated.push(val);
        } else if (val.event === 'proposal_approved') {
          acc.proposalApproved.push(val);
        }
      }

      return acc;
    },
    {
      all: [] as IssuableProposalCredentialContent[],
      proposalCreated: [] as IssuableProposalCredentialContent[],
      proposalApproved: [] as IssuableProposalCredentialContent[]
    }
  );

  const [publishingCredential, setPublishingCredential] = useState(false);

  const { account } = useWeb3Account();
  const { signer } = useWeb3Signer();

  const disableIssueCredentials =
    !account ||
    !signer ||
    !issuableProposalCredentials?.length ||
    !stringUtils.lowerCaseEqual(space?.credentialsWallet, account);

  async function handleIssueCredentials(_issuableProposalCredentials: IssuableProposalCredentialContent[]) {
    if (!signer) {
      return;
    }

    setPublishingCredential(true);

    try {
      await issueAndSaveProposalCredentials(_issuableProposalCredentials);
    } catch (err) {
      log.error('Error issuing credentials', err);
      showMessage('Error saving credentials', 'error');
    } finally {
      setPublishingCredential(false);
    }
  }

  return (
    <PropertyMenu
      lastChild={false}
      // add fontSize to icon to override MUI styles
      propertyTemplate={{ icon: <MedalIcon sx={{ fontSize: '16px !important' }} />, name: 'Issue Credentials' }}
    >
      <MenuItem onClick={() => handleIssueCredentials(proposalCreated)} sx={{ gap: 2 }}>
        <ListItemText primary={`${proposalLabel} Created`} />
        <Chip size='small' label={proposalCreated?.length} sx={{ fontWeight: 'bold' }} />
      </MenuItem>
      <MenuItem onClick={() => handleIssueCredentials(proposalApproved)} sx={{ gap: 2 }}>
        <ListItemText primary={`${proposalLabel} Approved`} />
        <Chip size='small' label={proposalApproved?.length} sx={{ fontWeight: 'bold' }} />
      </MenuItem>
      <MenuItem onClick={() => handleIssueCredentials(all)} sx={{ gap: 2 }}>
        <ListItemText primary='All credentials' />
        <Chip size='small' label={all?.length} sx={{ fontWeight: 'bold' }} />
      </MenuItem>
    </PropertyMenu>
  );
}
