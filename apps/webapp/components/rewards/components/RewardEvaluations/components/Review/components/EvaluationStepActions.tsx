import { Edit as EditIcon } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';

type Props = {
  canEdit?: boolean;
  openSettings?: () => void;
};

const preventAccordionToggle = (e: any) => e.stopPropagation();

export function EvaluationStepActions({ canEdit, openSettings }: Props) {
  return (
    <Box display='flex' gap={1} onClick={preventAccordionToggle}>
      <Tooltip disableInteractive title={!canEdit ? 'You do not have permission to edit this evaluation' : 'Edit'}>
        <span className='show-on-hover' style={{ opacity: undefined }}>
          <IconButton color='secondary' disabled={!canEdit} size='small' onClick={() => openSettings?.()}>
            <EditIcon fontSize='small' />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
