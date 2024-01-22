import type { CredentialTemplate } from '@charmverse/core/prisma-client';
import { useTheme } from '@emotion/react';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { Box, IconButton, ListItemButton, ListItemText, Popover, Tooltip, useMediaQuery } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRef, useState } from 'react';

import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useIsAdmin } from 'hooks/useIsAdmin';

export function CredentialTemplateRow({
  template,
  onClickDelete,
  onClickEdit
}: {
  template: CredentialTemplate;
  onClickEdit: (template: CredentialTemplate) => void;
  onClickDelete: (templateId: string) => void;
}) {
  const theme = useTheme();

  const isAdmin = useIsAdmin();

  const {
    isOpen,
    close,
    open: openDeleteDialog
  } = usePopupState({ variant: 'popover', popupId: 'credential-delete-popup' });

  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));
  const pageMenuAnchor = useRef();
  const [pageMenuAnchorElement, setPageMenuAnchorElement] = useState<null | Element>(null);

  function closeMenu() {
    setPageMenuAnchorElement(null);
  }

  return (
    <Box display='flex' justifyContent='space-between'>
      <Box component='span' sx={{ alignItems: 'center', display: 'flex' }}>
        <MedalIcon />
        {template.name}
      </Box>
      <Box ref={pageMenuAnchor} display='flex' alignSelf='stretch' alignItems='center'>
        <div>
          <Tooltip title='View comments, export content and more' arrow>
            <IconButton
              size={isLargeScreen ? 'small' : 'medium'}
              onClick={() => {
                setPageMenuAnchorElement(pageMenuAnchor.current || null);
              }}
            >
              <MoreHorizIcon data-test='header--show-page-actions' color='secondary' />
            </IconButton>
          </Tooltip>
        </div>
        <Popover
          anchorEl={pageMenuAnchorElement}
          open={!!pageMenuAnchorElement}
          onClose={closeMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left'
          }}
        >
          <Box>
            <div>
              <ListItemButton
                data-test='edit-credential-template'
                disabled={!isAdmin}
                onClick={() => onClickEdit(template)}
              >
                <EditOutlinedIcon
                  fontSize='small'
                  sx={{
                    mr: 1
                  }}
                />
                <ListItemText primary='Edit' />
              </ListItemButton>
            </div>
            <div>
              <ListItemButton data-test='delete-credential-template' disabled={!isAdmin} onClick={openDeleteDialog}>
                <DeleteOutlineOutlinedIcon
                  fontSize='small'
                  sx={{
                    mr: 1
                  }}
                />
                <ListItemText primary='Delete' />
              </ListItemButton>
            </div>
          </Box>
        </Popover>
      </Box>
      <ConfirmDeleteModal
        title='Delete credential template'
        question='Are you sure you want to delete this credential template?'
        onConfirm={() => onClickDelete(template.id)}
        onClose={close}
        open={isOpen}
      />
    </Box>
  );

  // if (isBasePageDocument || isBasePageDatabase || isForumPost) {
  //   return (

  //   );
  //   );
}
