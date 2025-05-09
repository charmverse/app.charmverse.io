import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import { Box, Card, Divider, FormLabel, Stack, Typography } from '@mui/material';

import { useGetAllowedDocusignUsersAndRoles } from 'charmClient/hooks/docusign';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { useDocusign } from 'components/signing/hooks/useDocusign';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { DocumentWithSigners } from '@packages/lib/proposals/documentsToSign/getProposalDocumentsToSign';
import type { PopulatedEvaluation } from '@packages/lib/proposals/interfaces';
import { getRelativeTimeInThePast } from '@packages/lib/utils/dates';

import { DocumentRow } from './DocumentsToSign';
import { SearchDocusign } from './SearchDocusign';

export type Props = {
  proposalId: string;
  evaluation: Pick<
    PopulatedEvaluation,
    | 'id'
    | 'completedAt'
    | 'reviewers'
    | 'result'
    | 'isReviewer'
    | 'actionLabels'
    | 'requiredReviews'
    | 'reviews'
    | 'declineReasonOptions'
    | 'appealable'
    | 'appealRequiredReviews'
    | 'appealReviewers'
    | 'type'
    | 'appealedAt'
    | 'appealedBy'
    | 'declinedAt'
    | 'isAppealReviewer'
  >;
  isCurrent: boolean;
  isAuthor?: boolean;
  isReviewer?: boolean;
  evaluationResult?: PopulatedEvaluation['result'];
  completedAt?: Date | null;
  refreshProposal: VoidFunction;
  documentsToSign?: DocumentWithSigners[];
};

export function SignDocuments({
  proposalId,
  isCurrent,
  isReviewer,
  isAuthor,
  evaluation,
  evaluationResult,
  completedAt,
  refreshProposal,
  documentsToSign
}: Props) {
  const completedDate = completedAt ? getRelativeTimeInThePast(new Date(completedAt)) : null;

  const reviewerOptions = evaluation.reviewers.map((reviewer) => ({
    id: (reviewer.roleId ?? reviewer.userId) as string,
    group: reviewer.roleId ? 'role' : 'user'
  }));

  const { space } = useCurrentSpace();

  const { showConfirmation } = useConfirmationModal();

  const { addDocumentToEvaluation, removeDocumentFromEvaluation } = useDocusign();

  async function handleAddDocument(envelopeId: string) {
    await addDocumentToEvaluation({ envelopeId, evaluationId: evaluation.id });
    refreshProposal();
  }

  async function handleRemoveDocument(doc: DocumentWithSigners) {
    if (doc.signers.every((signer) => signer.completedAt)) {
      const confirmation = await showConfirmation({
        title: 'Remove document',
        message: 'This document has been signed by all signers. Are you sure you want to remove it?'
      });

      if (!confirmation.confirmed) {
        return;
      }
    }

    await removeDocumentFromEvaluation({ envelopeId: doc.docusignEnvelopeId, evaluationId: evaluation.id });
    refreshProposal();
  }

  return (
    <>
      <Box mb={2}>
        <FormLabel>
          <Typography sx={{ mb: 1 }} variant='subtitle1'>
            Document preparers
          </Typography>
        </FormLabel>
        <UserAndRoleSelect
          data-test='evaluation-reviewer-select'
          systemRoles={[]}
          readOnly={true}
          value={reviewerOptions}
          onChange={() => {}}
        />
      </Box>
      {(isAuthor || isReviewer) && (
        <Card variant='outlined' sx={{ p: 2, gap: 2 }}>
          <Stack width='100%'>
            {documentsToSign?.map((doc) => (
              <>
                <DocumentRow
                  key={doc.id}
                  documentWithSigners={doc}
                  onRemoveDoc={isReviewer ? () => handleRemoveDocument(doc) : undefined}
                />
                <Divider sx={{ my: 2 }} />
              </>
            ))}
          </Stack>

          {isReviewer && (
            <Box display='flex' width='100%' justifyContent='space-between' alignItems='center'>
              <SearchDocusign
                selectedEnvelopeIds={documentsToSign?.map((doc) => doc.docusignEnvelopeId)}
                onSelectEnvelope={({ envelope }) => handleAddDocument(envelope.envelopeId)}
                proposalId={proposalId}
              />
            </Box>
          )}

          {evaluationResult === 'pass' && (
            <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' pb={2} px={2}>
              <ApprovedIcon color='success' />
              <Typography variant='body2'>Signed {completedDate}</Typography>
            </Stack>
          )}
          {evaluationResult === 'fail' && (
            <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' pb={2} px={2}>
              <RejectedIcon color='error' />
              <Typography variant='body2'>Cancelled {completedDate}</Typography>
            </Stack>
          )}
        </Card>
      )}
    </>
  );
}
