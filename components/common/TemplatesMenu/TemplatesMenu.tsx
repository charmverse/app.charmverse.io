import { useTheme } from '@emotion/react';
import { Box, Divider, ListItemIcon, ListItemText } from '@mui/material';
import Menu from '@mui/material/Menu';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import MenuItem from '@mui/material/MenuItem';
import type { Page } from '@prisma/client';
import { AddIcon } from 'components/common/Icons/AddIcon';
import { fancyTrim } from 'lib/utilities/strings';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { bindMenu } from 'material-ui-popup-state/hooks';
import { TemplatePageMenuActions } from './TemplatePageMenuActions';

/**
 * @enableItemOptions Defaults to true. Adds an external condition to decide if we enable the menu item options.
 */
interface Props {
  pages: Page[];
  createTemplate: () => void;
  editTemplate: (pageId: string) => void;
  deleteTemplate: (pageId: string) => void;
  addPageFromTemplate: (pageId: string) => void;
  anchorEl?: Element;
  popupState: PopupState;
  boardTitle?: string;
  enableItemOptions?: boolean;
}

export function TemplatesMenu ({
  pages, anchorEl, addPageFromTemplate, createTemplate, deleteTemplate, editTemplate, popupState, boardTitle, enableItemOptions = true
}: Props) {

  const theme = useTheme();

  const maxTitleLength = 35;

  return (
    <Menu {...bindMenu(popupState)} onClose={popupState.close} anchorEl={anchorEl} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} transformOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <MenuItem dense sx={{ pointerEvents: 'none' }}>Templates {boardTitle ? (<>for <b style={{ marginLeft: 4 }}>{boardTitle}</b></>) : ''} </MenuItem>

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
      <Divider />
      <MenuItem dense sx={{ color: `${theme.palette.primary.main} !important` }} onClick={createTemplate}>
        <AddIcon />
        <ListItemText>New template</ListItemText>
      </MenuItem>
    </Menu>
  );
}
