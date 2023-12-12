import type { PageMeta } from '@charmverse/core/pages';
import { useTheme } from '@emotion/react';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Box, Divider, ListItemIcon, ListItemText } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { bindMenu } from 'material-ui-popup-state/hooks';

import { AddIcon } from 'components/common/Icons/AddIcon';
import Link from 'components/common/Link';
import { fancyTrim } from 'lib/utilities/strings';

import LoadingComponent from '../LoadingComponent';

import { TemplatePageMenuActions } from './TemplatePageMenuActions';

/**
 * @enableItemOptions Defaults to true. Adds an external condition to decide if we enable the menu item options.
 */
interface Props {
  pages?: PageMeta[];
  deleteTemplate: (pageId: string) => void;
  anchorEl?: Element;
  popupState: PopupState;
  boardTitle?: string;
  enableItemOptions?: boolean;
  enableNewTemplates?: boolean;
  isLoading?: boolean;
}

export function TemplatesMenu({
  pages,
  anchorEl,
  deleteTemplate,
  popupState,
  boardTitle,
  enableItemOptions,
  enableNewTemplates,
  isLoading
}: Props) {
  const theme = useTheme();

  const maxTitleLength = 35;

  return (
    <Menu
      {...bindMenu(popupState)}
      disablePortal
      onClose={popupState.close}
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

      {isLoading && !pages && (
        <Box sx={{ my: 2 }}>
          <LoadingComponent size={20} />
        </Box>
      )}

      {pages?.length === 0 && (
        <MenuItem disabled dense sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <ListItemText>No templates found</ListItemText>
        </MenuItem>
      )}

      {pages &&
        pages.map((page) => {
          return (
            <MenuItem
              component={Link}
              data-test={`select-option-${page.id}`}
              key={page.id}
              dense
              sx={{ display: 'flex', justifyContent: 'space-between' }}
              href={`/proposals/new?template=${page.id}`}
              // onClick={() => {
              //   addPageFromTemplate(page.id);
              //   popupState.close();
              // }}
            >
              <ListItemIcon>
                <DescriptionOutlinedIcon />
              </ListItemIcon>
              <ListItemText>{fancyTrim(page.title || 'Untitled', maxTitleLength)}</ListItemText>

              {/* TODO - Revisit nested menu using this npm package https://github.com/steviebaa/mui-nested-menu */}
              <Box ml={1} onClick={(e) => e.stopPropagation()}>
                {enableItemOptions && <TemplatePageMenuActions deleteTemplate={deleteTemplate} pageId={page.id} />}
              </Box>
            </MenuItem>
          );
        })}
      {enableNewTemplates && [
        <Divider key='templates-menu-divider' />,
        <MenuItem
          component={Link}
          key='templates-menu-new-item'
          dense
          sx={{ color: `${theme.palette.primary.main} !important` }}
          href='/proposals/new?type=proposal_template'
        >
          <AddIcon />
          <ListItemText>New template</ListItemText>
        </MenuItem>
      ]}
    </Menu>
  );
}
