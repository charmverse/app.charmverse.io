import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Page } from "@prisma/client";
import { AddIcon } from 'components/common/Icons/AddIcon';
import { useTheme } from "@emotion/react";
import { DocumentPageIcon } from 'components/common/Icons/DocumentPageIcon';
import { bindMenu, PopupState } from 'material-ui-popup-state/hooks';
import { TemplatePageMenuActions } from './TemplatePageMenuActions';

interface Props {
  pages: Page[];
  createTemplate: () => void;
  editTemplate: (pageId: string) => void;
  deleteTemplate: (pageId: string) => void;
  addPageFromTemplate: (pageId: string) => void;
  anchorEl?: Element;
  popupState: PopupState
}

export function TemplatesMenu({pages, anchorEl, addPageFromTemplate, createTemplate, deleteTemplate, editTemplate, popupState}: Props) {

  const theme = useTheme();

  return (
    <Menu {...bindMenu(popupState)} onClose={popupState.close} anchorEl={anchorEl} >
      <MenuItem>Templates</MenuItem>
      <Divider />
      {
        pages.map((page) => {
          return (
        <MenuItem onClick={() => addPageFromTemplate(page.id)}>
          <Box sx={{display: 'inline-block', justifyContent: 'space-between'}}>
            <DocumentPageIcon label={page.title || 'Untited'} />

            {/* TODO - Revisit nested menu using this npm package https://github.com/steviebaa/mui-nested-menu */}
            <TemplatePageMenuActions editTemplate={editTemplate} deleteTemplate={deleteTemplate} page={page} />
          </Box>
          
        </MenuItem>
          )
      })}
      <Divider />
      <MenuItem onClick={createTemplate}>
        <AddIcon />
        <ListItemText>New template</ListItemText>
      </MenuItem>
    </Menu>
  )
}