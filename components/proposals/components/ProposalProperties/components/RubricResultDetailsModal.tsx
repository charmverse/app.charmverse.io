import type { ProposalRubricCriteria } from '@charmverse/core/prisma-client';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { ReviewerResults } from 'lib/proposal/rubric/aggregateResults';

export function RubricResultDetailsModal({
  isOpen,
  onClose,
  title,
  reviewerId,
  reviewerResults,
  criteriaList
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reviewerId: string | null;
  criteriaList: ProposalRubricCriteria[];
  reviewerResults?: ReviewerResults | undefined;
}) {
  const { getMemberById } = useMembers();
  const member = reviewerId ? getMemberById(reviewerId) : undefined;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      title={title}
      className='CardDetail content'
      scroll='paper'
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        {title}

        {onClose && (
          <IconButton
            aria-label='close'
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 10
            }}
          >
            <CloseIcon color='secondary' />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ px: 6 }}>
        <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
          <Box display='flex' height='fit-content' flex={1} marginLeft='-8px'>
            <PropertyLabel readOnly>Reviewer</PropertyLabel>
            <Stack justifyContent='center'>
              <UserDisplay user={member} avatarSize='small' />
            </Stack>
          </Box>
        </Box>
        {criteriaList.map((criteria) => (
          <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px' key={criteria.id}>
            <Divider sx={{ my: 1 }} />
            <Box display='flex' height='fit-content' flex={1} marginLeft='-8px'>
              <Tooltip title={criteria.title}>
                <Box minWidth='150px'>
                  <PropertyLabel readOnly>{criteria.title}</PropertyLabel>
                </Box>
              </Tooltip>

              <Stack justifyContent='center'>
                <Typography>{reviewerResults?.answersMap[criteria.id]?.score || '-'}</Typography>
              </Stack>
            </Box>
            <Box display='flex' height='fit-content' flex={1} marginLeft='-8px'>
              <Box minWidth='150px'>
                <PropertyLabel readOnly>Comment</PropertyLabel>
              </Box>
              <Stack justifyContent='center'>
                <Typography variant='caption'>{reviewerResults?.answersMap[criteria.id]?.comment || '-'}</Typography>
              </Stack>
            </Box>
          </Box>
        ))}

        <Divider sx={{ my: 1, borderColor: 'var(--text-primary)' }} />
        <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
          <Box display='flex' height='fit-content' flex={1} marginLeft='-8px'>
            <PropertyLabel readOnly>Average</PropertyLabel>
            <Stack justifyContent='center'>
              <Typography>{reviewerResults?.average?.toFixed(2) || '-'}</Typography>
            </Stack>
          </Box>
          <Box display='flex' height='fit-content' flex={1} marginLeft='-8px'>
            <PropertyLabel readOnly>Sum</PropertyLabel>
            <Stack justifyContent='center'>
              <Typography>{reviewerResults?.sum || '-'}</Typography>
            </Stack>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
