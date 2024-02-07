import type { CredentialTemplate } from '@charmverse/core/prisma-client';
import { Box, Tooltip } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import { useGetCredentialTemplates } from 'charmClient/hooks/credentials';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';

import { CredentialTemplateDialog } from './CredentialTemplateDialog';
import { CredentialTemplateRow } from './CredentialTemplateRow';

export function CredentialTemplates() {
  const { space } = useCurrentSpace();

  const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate | null>(null);

  const { isOpen, close, open } = usePopupState({ variant: 'popover', popupId: 'credential-popup' });

  const isAdmin = useIsAdmin();
  const { showMessage } = useSnackbar();

  const { data: credentialTemplates, mutate: refreshCredentialTemplates } = useGetCredentialTemplates({
    spaceId: space?.id
  });

  async function handleDelete(templateId: string) {
    try {
      await charmClient.credentials.deleteCredentialTemplate(templateId);
      refreshCredentialTemplates();
    } catch (error: any) {
      showMessage(error.message ?? 'Error deleting credential template', 'error');
    }
  }

  function openDialog(template?: CredentialTemplate) {
    setSelectedTemplate(template ?? null);
    open();
  }

  function closeDialog() {
    setSelectedTemplate(null);
    close();
  }

  if (!credentialTemplates) {
    return <LoadingComponent />;
  }

  return (
    <Box>
      {credentialTemplates.map((template) => (
        <CredentialTemplateRow
          key={template.id}
          template={template}
          onClickDelete={handleDelete}
          onClickEdit={openDialog}
        />
      ))}
      <Tooltip title={!isAdmin ? 'Only space admins can create workflows' : ''} arrow>
        <Button onClick={open} variant='text' sx={{ width: '120px' }} dataTest='add-credential'>
          + Add a credential
        </Button>
      </Tooltip>
      <CredentialTemplateDialog
        credentialTemplate={selectedTemplate}
        isOpen={isOpen}
        onClose={closeDialog}
        refreshTemplates={refreshCredentialTemplates}
      />
    </Box>
  );
}
