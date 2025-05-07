import { useTheme } from '@emotion/react';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import { Box, Divider, ListItemIcon, ListItemText, Typography } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { fancyTrim } from '@packages/utils/strings';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { bindMenu } from 'material-ui-popup-state/hooks';

import { AddIcon } from 'components/common/Icons/AddIcon';

import LoadingComponent from '../LoadingComponent';

import type { Props as ActionMenuProps } from './TemplatePageActionMenu';
import { TemplatePageActionMenu } from './TemplatePageActionMenu';

export type TemplateItem = {
  title: string;
  id: string;
  isStructuredProposal?: boolean;
  proposalId?: string | null;
  archived?: boolean;
  draft?: boolean;
};

type TemplateMenuItemProps<T extends TemplateItem> = {
  editTemplate: (pageId: string) => void;
  deleteTemplate: (pageId: string) => void;
  addPageFromTemplate: (template: T) => void;
  enableItemOptions?: boolean;
  pageActions?: ActionMenuProps['pageActions'];
};

type Props<T extends TemplateItem> = {
  templates?: T[];
  createTemplate: () => void;
  anchorEl?: Element;
  popupState: PopupState;
  boardTitle?: string;
  enableNewTemplates?: boolean;
  isLoading?: boolean;
} & TemplateMenuItemProps<T>;

const maxTitleLength = 35;

export function TemplatesMenu<T extends TemplateItem>({
  templates,
  anchorEl,
  createTemplate,
  popupState,
  boardTitle,
  enableNewTemplates,
  isLoading,
  ...itemProps
}: Props<T>) {
  const theme = useTheme();

  const liveTemplates = templates?.filter((tpl) => !tpl.archived && !tpl.draft);
  const draftTemplates = templates?.filter((tpl) => !tpl.archived && !!tpl.draft);
  const archivedTemplates = templates?.filter((tpl) => !!tpl.archived);

  return (
    <Menu
      {...bindMenu(popupState)}
      disablePortal
      onClose={() => popupState.close()}
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <MenuItem dense sx={{ pointerEvents: 'none' }}>
        Templates{' '}
        {boardTitle ? (
          <>
            for <b style={{ marginLeft: 4 }}>{boardTitle}</b>
          </>
        ) : (
          ''
        )}{' '}
      </MenuItem>

      {isLoading && !templates && (
        <Box sx={{ my: 2 }}>
          <LoadingComponent size={20} />
        </Box>
      )}

      {templates?.length === 0 && (
        <MenuItem disabled dense sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <ListItemText>No templates found</ListItemText>
        </MenuItem>
      )}

      {liveTemplates?.map((template) => (
        <TemplateMenuItem key={template.id} {...itemProps} closePopup={popupState.close} template={template} />
      ))}
      {/* Menu cannot have fragments as children, so use array notation instead */}
      {!!draftTemplates?.length && [
        <Divider key={0} />,
        <Box pl={2} key={1}>
          <Typography color='secondary' variant='caption'>
            Draft
          </Typography>
        </Box>,
        draftTemplates.map((template) => (
          <TemplateMenuItem key={template.id} {...itemProps} closePopup={popupState.close} template={template} />
        ))
      ]}
      {!!archivedTemplates?.length && [
        <Divider key={0} />,
        <Box pl={2} key={1}>
          <Typography color='secondary' variant='caption'>
            Archive
          </Typography>
        </Box>,
        ...archivedTemplates.map((template) => (
          <TemplateMenuItem key={template.id} {...itemProps} closePopup={popupState.close} template={template} />
        ))
      ]}
      {enableNewTemplates && [
        <Divider key='templates-menu-divider' />,
        <MenuItem
          key='templates-menu-new-item'
          dense
          sx={{ color: `${theme.palette.primary.main} !important` }}
          onClick={createTemplate}
          data-test='new-template-button'
        >
          <AddIcon />
          <ListItemText>New template</ListItemText>
        </MenuItem>
      ]}
    </Menu>
  );
}

function TemplateMenuItem<T extends TemplateItem>({
  template,
  addPageFromTemplate,
  editTemplate,
  deleteTemplate,
  closePopup,
  enableItemOptions,
  pageActions
}: TemplateMenuItemProps<T> & { closePopup: VoidFunction; template: T }) {
  return (
    <MenuItem
      data-test={`select-option-${template.id}`}
      key={template.id}
      dense
      sx={{ display: 'flex', justifyContent: 'space-between' }}
      onClick={() => {
        addPageFromTemplate(template);
        closePopup();
      }}
    >
      <ListItemIcon>
        {template.isStructuredProposal ? <WidgetsOutlinedIcon /> : <DescriptionOutlinedIcon />}
      </ListItemIcon>
      <ListItemText>{fancyTrim(template.title || 'Untitled', maxTitleLength)}</ListItemText>

      {/* TODO - Revisit nested menu using this npm package https://github.com/steviebaa/mui-nested-menu */}
      <Box ml={1} onClick={(e) => e.stopPropagation()}>
        {enableItemOptions && (
          <TemplatePageActionMenu
            editTemplate={editTemplate}
            deleteTemplate={deleteTemplate}
            pageId={template.id}
            proposalId={template.proposalId}
            closeParentPopup={closePopup}
            pageActions={pageActions}
          />
        )}
      </Box>
    </MenuItem>
  );
}
