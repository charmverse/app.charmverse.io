import { Alert, Box, Divider, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { RiChatCheckLine } from 'react-icons/ri';

import { useGetAllReviewerUserIds } from 'charmClient/hooks/proposals';
import type { ProposalEvaluationValues } from 'components/[pageId]/DocumentPage/components/Sidebar/components/ProposalSettingsSidebar/components/ProposalEvaluationForm';
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
  proposal?: Pick<ProposalPropertiesInput, 'categoryId' | 'evaluations'>;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
};

export function ProposalSettingsSidebar({ proposal, onChangeEvaluation }: Props) {
  const isAdmin = useIsAdmin();

  const canEdit = isAdmin;

  const evaluationsWithConfig = proposal?.evaluations.filter((e) => e.type !== 'feedback');

  return (
    // <Box className='octo-propertyrow' mb='0 !important'>
    <Box display='flex' flex={1} flexDirection='column' ml={1}>
      {proposal &&
        evaluationsWithConfig?.map((evaluation) => (
          <>
            <Divider sx={{ mb: 1 }} />
            <ProposalEvaluationForm
              categoryId={proposal.categoryId}
              evaluation={evaluation}
              onChange={(updated) => {
                onChangeEvaluation?.(evaluation.id, updated);
              }}
            />
          </>
        ))}
      {proposal && evaluationsWithConfig?.length === 0 && (
        <Typography variant='body2' color='secondary'>
          No evaluations configured
        </Typography>
      )}
    </Box>
  );
}
