import { Edit as EditIcon } from '@mui/icons-material';
import { Alert, Box, Typography, IconButton, SvgIcon } from '@mui/material';
import { useMemo, useState } from 'react';
import { RiChatCheckLine } from 'react-icons/ri';

import { useGetAllReviewerUserIds } from 'charmClient/hooks/proposals';
import LoadingComponent from 'components/common/LoadingComponent';
import type { TabConfig } from 'components/common/MultiTabs';
import MultiTabs from 'components/common/MultiTabs';
import { useProposalPermissions } from 'components/proposals/hooks/useProposalPermissions';
import { evaluationIcons } from 'components/settings/proposals/constants';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from 'lib/proposal/interface';

import { NoCommentsMessage } from '../../CommentsSidebar';

import { RubricAnswersForm } from './RubricAnswersForm';
import { RubricResults } from './RubricResults';

export type Props = {
  pageId?: string;
  proposal?: Pick<ProposalWithUsersAndRubric, 'id' | 'authors' | 'evaluations' | 'status' | 'evaluationType'>;
  evaluation: PopulatedEvaluation;
  refreshProposal?: VoidFunction;
  goToEditProposal: VoidFunction;
};

export function PassFailEvaluation({ pageId, proposal, evaluation, refreshProposal, goToEditProposal }: Props) {
  const isAdmin = useIsAdmin();
  const { user } = useUser();

  const isAuthor = proposal?.authors.find((author) => author.userId === user?.id);
  return (
    <Box>
      <Typography>
        <Box display='flex' alignItems='center'>
          <Box mr={1}>{evaluationIcons[evaluation.type]()}</Box>
          <Box>{evaluation.title}</Box>
        </Box>
      </Typography>
    </Box>
  );
}
