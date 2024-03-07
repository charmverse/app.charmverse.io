import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import { Box, Chip, Collapse, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { usePopupState, bindMenu } from 'material-ui-popup-state/hooks';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { CiImport } from 'react-icons/ci';

import { useGetRubricTemplates } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { RubricTemplate } from 'lib/proposals/rubric/getRubricTemplates';

type Props = {
  onSelect: (template: RubricTemplate) => void;
};

export function RubricTemplatesButton({ onSelect }: Props) {
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

function TemplatesMenu({ onSelect, popupState }: Props & { popupState: PopupState }) {
  const { space } = useCurrentSpace();
  const { data: templates } = useGetRubricTemplates(space?.id);
  return (
    <Menu {...bindMenu(popupState)} open>
      <MenuItem dense sx={{ pointerEvents: 'none' }}>
        <ListItemText secondary='Copy rubric from a template' />
      </MenuItem>
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
