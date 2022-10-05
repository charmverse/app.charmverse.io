import { useTheme } from '@emotion/react';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Box, Divider, ListItemIcon, ListItemText } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { bindMenu } from 'material-ui-popup-state/hooks';

import { AddIcon } from 'components/common/Icons/AddIcon';
import type { PageMeta } from 'lib/pages';
import { fancyTrim } from 'lib/utilities/strings';

import { TemplatePageMenuActions } from './TemplatePageMenuActions';

/**
 * @enableItemOptions Defaults to true. Adds an external condition to decide if we enable the menu item options.
 */
interface Props {
  pages: PageMeta[];
  createTemplate: () => void;
  editTemplate: (pageId: string) => void;
  deleteTemplate: (pageId: string) => void;
  addPageFromTemplate: (pageId: string) => void;
  anchorEl?: Element;
  popupState: PopupState;
  boardTitle?: string;
  enableItemOptions?: boolean;
  enableNewTemplates?: boolean;
}

export function TemplatesMenu ({
  pages,
  anchorEl,
  addPageFromTemplate,
  createTemplate,
  deleteTemplate,
  editTemplate,
  popupState,
  boardTitle,
  enableItemOptions,
  enableNewTemplates
}: Props) {

  const theme = useTheme();

  const maxTitleLength = 35;

  return (
    <Menu {...bindMenu(popupState)} onClose={popupState.close} anchorEl={anchorEl} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} transformOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <MenuItem dense sx={{ pointerEvents: 'none' }}>Templates {boardTitle ? (<>for <b style={{ marginLeft: 4 }}>{boardTitle}</b></>) : ''} </MenuItem>

      {
        pages.length === 0 && (
          <MenuItem
            dense
            sx={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <ListItemText>No templates found</ListItemText>
          </MenuItem>
        )
      }

      {
        pages.map((page) => {

          return (
            <MenuItem
              key={page.id}
              dense
              sx={{ display: 'flex', justifyContent: 'space-between' }}
              onClick={() => {
                addPageFromTemplate(page.id);
                popupState.close();
              }}
            >
              <ListItemIcon><DescriptionOutlinedIcon /></ListItemIcon>
              <ListItemText>{fancyTrim(page.title || 'Untitled', maxTitleLength)}</ListItemText>

              {/* TODO - Revisit nested menu using this npm package https://github.com/steviebaa/mui-nested-menu */}
              <Box ml={1} onClick={e => e.stopPropagation()}>
                {
                enableItemOptions && (
                  <TemplatePageMenuActions
                    editTemplate={editTemplate}
                    deleteTemplate={deleteTemplate}
                    pageId={page.id}
                    closeParentPopup={popupState.close}
                  />
                )
              }
              </Box>

            </MenuItem>
          );
        })
}
      {
    enableNewTemplates && (
      [
        <Divider key='templates-menu-divider' />,
        <MenuItem key='templates-menu-new-item' dense sx={{ color: `${theme.palette.primary.main} !important` }} onClick={createTemplate}>
          <AddIcon />
          <ListItemText>New template</ListItemText>
        </MenuItem>
      ]
    )
  }
    </Menu>
  );
}
