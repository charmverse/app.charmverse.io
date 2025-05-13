import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import { Box, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { usePopupState, bindMenu } from 'material-ui-popup-state/hooks';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { CiImport } from 'react-icons/ci';

import { useGetRubricTemplates } from 'charmClient/hooks/proposals';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { RubricTemplate } from '@packages/lib/proposals/rubric/getRubricTemplates';

type Props = {
  excludeEvaluationId: string;
  onSelect: (template: RubricTemplate) => void;
};

export function RubricTemplatesButton({ excludeEvaluationId, onSelect }: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'rubric-templates' });
  return (
    <>
      <Tooltip title='Import from template'>
        <span>
          <IconButton size='small' onClick={popupState.open}>
            <CiImport />
          </IconButton>
        </span>
      </Tooltip>
      {popupState.isOpen && (
        <TemplatesMenu
          excludeEvaluationId={excludeEvaluationId}
          popupState={popupState}
          onSelect={(template) => {
            onSelect(template);
            popupState.close();
          }}
        />
      )}
    </>
  );
}

function TemplatesMenu({ excludeEvaluationId, onSelect, popupState }: Props & { popupState: PopupState }) {
  const { space } = useCurrentSpace();
  const { data: templates, isLoading } = useGetRubricTemplates({ spaceId: space?.id, excludeEvaluationId });
  return (
    <Menu {...bindMenu(popupState)} open>
      <MenuItem dense sx={{ pointerEvents: 'none' }}>
        <ListItemText secondary='Copy rubric from a template' />
      </MenuItem>
      {isLoading && (
        <Box my={2}>
          <LoadingComponent size={20} />
        </Box>
      )}
      {templates?.length === 0 && (
        <MenuItem disabled dense sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <ListItemText>No templates found</ListItemText>
        </MenuItem>
      )}
      {(templates || []).map((template) => (
        <MenuItem key={template.pageTitle} onClick={() => onSelect(template)}>
          <ListItemIcon>
            <LayersOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={template.pageTitle} secondary={template.evaluationTitle} />
        </MenuItem>
      ))}
    </Menu>
  );
}
