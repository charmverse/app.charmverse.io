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
import { fancyTrim } from 'lib/utilities/strings';

interface Props {
  pages: Page[];
  createTemplate: () => void;
  editTemplate: (pageId: string) => void;
  deleteTemplate: (pageId: string) => void;
  addPageFromTemplate: (pageId: string) => void;
  anchorEl?: Element;
  popupState: PopupState;
  boardTitle?: string;
}

export function TemplatesMenu({pages, anchorEl, addPageFromTemplate, createTemplate, deleteTemplate, editTemplate, popupState, boardTitle}: Props) {

  const theme = useTheme();

  const maxTitleLength = 35;

  return (
    <Menu  {...bindMenu(popupState)} onClose={popupState.close} anchorEl={anchorEl} >
      <MenuItem>Templates {boardTitle ? (<>for <b style={{marginLeft: 4}}>{boardTitle}</b></>) : ''} </MenuItem>
      <Divider />
      {
        pages.map((page) => {

          return (
        <MenuItem sx={{display: 'flex', justifyContent: 'space-between'}} >
            <DocumentPageIcon onClick={() => addPageFromTemplate(page.id)} label={fancyTrim(page.title || 'Untitled', maxTitleLength)} />

            {/* TODO - Revisit nested menu using this npm package https://github.com/steviebaa/mui-nested-menu */}
            <TemplatePageMenuActions editTemplate={editTemplate} deleteTemplate={deleteTemplate} page={page} />
        </MenuItem>
          )
      })}
      <Divider />
      <MenuItem sx={{color: theme.palette.primary.main + ' !important'}} onClick={createTemplate}>
        <AddIcon />
        <ListItemText>New template</ListItemText>
      </MenuItem>
    </Menu>
  )
}