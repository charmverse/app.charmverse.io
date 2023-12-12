import { Alert, Box, Divider, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { RiChatCheckLine } from 'react-icons/ri';

import { useGetAllReviewerUserIds } from 'charmClient/hooks/proposals';
import LoadingComponent from 'components/common/LoadingComponent';
import type { TabConfig } from 'components/common/MultiTabs';
import MultiTabs from 'components/common/MultiTabs';
import type { ProposalPropertiesInput } from 'components/proposals/components/ProposalProperties/ProposalPropertiesBase';
import { useProposalPermissions } from 'components/proposals/hooks/useProposalPermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { ProposalEvaluationForm } from './components/ProposalEvaluationForm';

export type Props = {
  proposal?: ProposalPropertiesInput;
  onChangeProposal?: (updated: ProposalPropertiesInput) => void;
};

export function ProposalSettingsSidebar({ proposal, onChangeProposal }: Props) {
  const isAdmin = useIsAdmin();

  const canEdit = isAdmin;

  return (
    // <Box className='octo-propertyrow' mb='0 !important'>
    <Box display='flex' flex={1} flexDirection='column' ml={1}>
      {proposal?.evaluations.map((evaluation) => (
        <>
          <Divider sx={{ m: '0 !important' }} />
          <Typography variant='subtitle1'>{evaluation.type}</Typography>
          <ProposalEvaluationForm
            categoryId={proposal.categoryId}
            evaluation={evaluation}
            onChange={(updated) => {
              const evaluations = proposal.evaluations.map((e) => (e.id === updated.id ? updated : e));
              onChangeProposal?.({
                ...proposal,
                evaluations
              });
            }}
          />
        </>
      ))}
    </Box>
  );
}
