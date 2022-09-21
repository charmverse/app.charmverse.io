import { useTheme } from '@emotion/react';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { Page } from '@prisma/client';
import { AddIcon } from 'components/common/Icons/AddIcon';
import { DocumentPageIcon } from 'components/common/Icons/DocumentPageIcon';
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
    <Menu {...bindMenu(popupState)} onClose={popupState.close} anchorEl={anchorEl}>
      <MenuItem>Templates {boardTitle ? (<>for <b style={{ marginLeft: 4 }}>{boardTitle}</b></>) : ''} </MenuItem>
      <Divider />
      {
        pages.map((page) => {

          return (
            <MenuItem sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <DocumentPageIcon
                onClick={() => {
                  addPageFromTemplate(page.id);
                  popupState.close();
                }}
                label={fancyTrim(page.title || 'Untitled', maxTitleLength)}
              />

              {/* TODO - Revisit nested menu using this npm package https://github.com/steviebaa/mui-nested-menu */}
              {
                enableItemOptions && <TemplatePageMenuActions editTemplate={editTemplate} deleteTemplate={deleteTemplate} page={page} />
              }

            </MenuItem>
          );
        })
}
      <Divider />
      <MenuItem sx={{ color: `${theme.palette.primary.main} !important` }} onClick={createTemplate}>
        <AddIcon />
        <ListItemText>New template</ListItemText>
      </MenuItem>
    </Menu>
  );
}
