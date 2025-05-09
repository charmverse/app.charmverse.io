import { Edit as EditIcon } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

type Props = {
  onClick?: () => void;
  hidden?: boolean;
  readOnly?: boolean;
  readOnlyTooltip: string;
};

const preventAccordionToggle = (e: any) => e.stopPropagation();

export function EditStepButton({ onClick, readOnly, readOnlyTooltip, hidden }: Props) {
  return (
    <Tooltip disableInteractive title={readOnly ? readOnlyTooltip : 'Edit'}>
      <span className='show-on-hover' style={{ opacity: hidden ? 0 : undefined }}>
        <IconButton
          color='secondary'
          disabled={readOnly}
          size='small'
          onClick={(e) => {
            preventAccordionToggle(e);
            onClick?.();
          }}
        >
          <EditIcon fontSize='small' />
        </IconButton>
      </span>
    </Tooltip>
  );
}
