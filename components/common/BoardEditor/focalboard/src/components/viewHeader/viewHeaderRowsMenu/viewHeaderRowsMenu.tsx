import type { ProposalSystemRole } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Stack, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo, useState } from 'react';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';

import mutator from '../../../mutator';

import { StyledMenuItem } from './PropertyMenu';
import { PropertyTemplateMenu } from './PropertyTemplateMenu';

const StyledStack = styled(Stack)`
  flex-direction: row;
  align-items: center;
  z-index: 1;
  overflow: auto;
  width: 100%;
  margin-right: 8px;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
`;

export function ViewHeaderRowsMenu({
  cards,
  checkedIds,
  setCheckedIds,
  board,
  propertyTemplates,
  onChange,
  onDelete
}: {
  board: Board;
  cards: Card[];
  setCheckedIds: Dispatch<SetStateAction<string[]>>;
  checkedIds: string[];
  propertyTemplates: IPropertyTemplate<PropertyType>[];
  onChange?: VoidFunction;
  onDelete?: (pageIds: string[]) => Promise<void>;
}) {
  const { pages } = usePages();
  const isAdmin = useIsAdmin();
  const { proposals } = useProposals();
  const [isDeleting, setIsDeleting] = useState(false);
  async function deleteCheckedCards() {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(checkedIds);
      } else {
        await mutator.deleteBlocks(checkedIds, 'delete cards');
      }
    } catch (_) {
      //
    } finally {
      setCheckedIds([]);
      setIsDeleting(false);
    }
  }

  async function updateProposalsAuthor(pageIds: string[], authorIds: string[]) {
    for (const pageId of pageIds) {
      const proposalId = pages[pageId]?.proposalId;
      if (proposalId) {
        try {
          await charmClient.proposals.updateProposal({
            authors: authorIds,
            proposalId
          });
        } catch (err) {
          //
        }
      }
    }
  }

  async function updateProposalsReviewer(pageIds: string[], reviewers: SelectOption[]) {
    let proposalReviewersChanged = false;
    for (const pageId of pageIds) {
      const page = pages[pageId];
      const proposalId = page?.proposalId;
      const proposal = proposalId ? proposals?.find((_proposal) => _proposal.id === proposalId) : null;
      const proposalWithEvaluationId = proposal?.currentEvaluationId;
      if (
        proposal &&
        proposalWithEvaluationId &&
        proposal.currentStep?.step !== 'draft' &&
        proposal.currentStep?.step !== 'feedback' &&
        !page?.sourceTemplateId
      ) {
        await charmClient.proposals.updateProposalEvaluation({
          reviewers: reviewers.map((reviewer) => ({
            roleId: reviewer.group === 'role' ? reviewer.id : null,
            systemRole: reviewer.group === 'system_role' ? (reviewer.id as ProposalSystemRole) : null,
            userId: reviewer.group === 'user' ? reviewer.id : null
          })),
          proposalId: proposal.id,
          evaluationId: proposalWithEvaluationId
        });
        proposalReviewersChanged = true;
      }
    }
    if (proposalReviewersChanged) {
      await mutate(`/api/spaces/${board.spaceId}/proposals`);
    }
  }

  const filteredPropertyTemplates = useMemo(() => {
    return propertyTemplates.filter((propertyTemplate) => !propertyTemplate.formFieldId);
  }, [propertyTemplates]);

  return (
    <StyledStack>
      <StyledMenuItem>
        <Typography onClick={() => setCheckedIds([])} color='primary' variant='body2'>
          {checkedIds.length} selected
        </Typography>
      </StyledMenuItem>
      {cards.length !== 0
        ? filteredPropertyTemplates.map((propertyTemplate) => (
            <PropertyTemplateMenu
              isAdmin={isAdmin}
              board={board}
              checkedIds={checkedIds}
              cards={cards}
              propertyTemplate={propertyTemplate}
              key={propertyTemplate.id}
              onChange={onChange}
              onProposalAuthorSelect={updateProposalsAuthor}
              onProposalReviewerSelect={updateProposalsReviewer}
            />
          ))
        : null}
      <StyledMenuItem onClick={deleteCheckedCards} disabled={isDeleting}>
        <DeleteOutlinedIcon fontSize='small' />
      </StyledMenuItem>
    </StyledStack>
  );
}
