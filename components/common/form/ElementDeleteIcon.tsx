import DeleteOutlinedIcon from '@mui/icons-material/Close';
import Tooltip from '@mui/material/Tooltip';

import ButtonChip from 'components/common/ButtonChip';

interface Props {
  onClick: () => void;
  tooltip?: string;
}

export default function ElementDeleteIcon({ onClick, tooltip = 'Delete' }: Props) {
  return (
    <Tooltip arrow placement='top' title={tooltip}>
      <ButtonChip
        className='row-actions'
        icon={<DeleteOutlinedIcon />}
        clickable
        color='secondary'
        size='small'
        variant='outlined'
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      />
    </Tooltip>
  );
}
