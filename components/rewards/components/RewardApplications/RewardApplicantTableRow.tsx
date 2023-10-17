import { IconButton, TableCell, TableRow, Tooltip } from '@mui/material';

import { Button } from 'components/common/Button';
import UserDisplay from 'components/common/UserDisplay';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useMembers } from 'hooks/useMembers';
import type { ApplicationMeta } from 'lib/rewards/interfaces';

import { RewardApplicationStatusChip } from '../RewardApplicationStatusChip';

interface Props {
  submission: ApplicationMeta;
  onClickView: () => void;
}

export function RewardApplicantTableRow({ submission, onClickView }: Props) {
  const { getMemberById } = useMembers();
  const member = getMemberById(submission.createdBy);
  const { formatDateTime } = useDateFormatter();

  return (
    <TableRow key={submission.id} hover sx={{ '.MuiTableCell-root': { borderBottom: 0 } }}>
      <TableCell size='small'>
        {member ? <UserDisplay avatarSize='small' user={member} fontSize='small' showMiniProfile /> : 'Anonymous'}
      </TableCell>
      <TableCell>
        <RewardApplicationStatusChip status={submission.status} />
      </TableCell>
      <TableCell>{formatDateTime(submission.updatedAt)}</TableCell>

      <TableCell align='right'>
        <Tooltip title='View application details'>
          <Button variant='outlined' onClick={onClickView}>
            View
          </Button>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
