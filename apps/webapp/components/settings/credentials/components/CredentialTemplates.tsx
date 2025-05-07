import type { AttestationType, CredentialTemplate } from '@charmverse/core/prisma-client';
import { Box, Tooltip } from '@mui/material';
import Stack from '@mui/material/Stack';
import { capitalize } from '@packages/utils/strings';
import { useState } from 'react';

import charmClient from 'charmClient';
import { useGetCredentialTemplates } from 'charmClient/hooks/credentials';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { Typography } from 'components/common/Typography';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { CredentialTemplateDialog } from './CredentialTemplateDialog';
import { CredentialTemplateRow } from './CredentialTemplateRow';

export function CredentialTemplates() {
  const { getFeatureTitle } = useSpaceFeatures();

  const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate | null>(null);

  const [selectedNewCredentialType, setSelectedNewCredentialType] = useState<AttestationType | null>(null);

  const isAdmin = useIsAdmin();
  const { showMessage } = useSnackbar();

  const { credentialTemplates, refreshCredentialTemplates, proposalCredentialTemplates, rewardCredentialTemplates } =
    useGetCredentialTemplates();

  async function handleDelete(templateId: string) {
    try {
      await charmClient.credentials.deleteCredentialTemplate(templateId);
      refreshCredentialTemplates();
    } catch (error: any) {
      showMessage(error.message ?? 'Error deleting credential template', 'error');
    }
  }

  function openDialog({
    template,
    newTemplateType
  }: {
    template?: CredentialTemplate;
    newTemplateType?: AttestationType;
  }) {
    setSelectedTemplate(template ?? null);
    setSelectedNewCredentialType(newTemplateType ?? null);
  }

  function closeDialog() {
    setSelectedTemplate(null);
    setSelectedNewCredentialType(null);
  }

  if (!credentialTemplates) {
    return <LoadingComponent />;
  }

  const isOpen = !!selectedTemplate || !!selectedNewCredentialType;

  return (
    <Stack display='flex' flexDirection='column' gap={2}>
      <Typography variant='body1'>
        Create credentials with EAS attestations to be awarded for {getFeatureTitle('Proposals').toLowerCase()} or{' '}
        {getFeatureTitle('Rewards').toLowerCase()}
      </Typography>
      <Box>
        <Box display='flex' alignItems='center' flexDirection='row' justifyContent='space-between'>
          <Typography variant='subtitle1'>{capitalize(getFeatureTitle('proposals'))}</Typography>
          <Tooltip title={!isAdmin ? 'Only space admins can create credentials' : ''} arrow>
            <Button
              onClick={() => openDialog({ newTemplateType: 'proposal' })}
              color='secondary'
              variant='outlined'
              size='small'
              disabled={!isAdmin}
              data-test='add-proposal-credential'
            >
              + Add a credential
            </Button>
          </Tooltip>
        </Box>

        {proposalCredentialTemplates?.map((template) => (
          <CredentialTemplateRow
            key={template.id}
            template={template}
            onClickDelete={handleDelete}
            onClickEdit={(credentialTemplate) => openDialog({ template: credentialTemplate })}
          />
        ))}
      </Box>
      <Box>
        <Box display='flex' alignItems='center' flexDirection='row' justifyContent='space-between'>
          <Typography variant='subtitle1'>{capitalize(getFeatureTitle('rewards'))}</Typography>
          <Tooltip title={!isAdmin ? 'Only space admins can create credentials' : ''} arrow>
            <Button
              onClick={() => openDialog({ newTemplateType: 'reward' })}
              color='secondary'
              variant='outlined'
              size='small'
              disabled={!isAdmin}
              data-test='add-proposal-credential'
            >
              + Add a credential
            </Button>
          </Tooltip>
        </Box>

        {rewardCredentialTemplates?.map((template) => (
          <CredentialTemplateRow
            key={template.id}
            template={template}
            onClickDelete={handleDelete}
            onClickEdit={(credentialTemplate) => openDialog({ template: credentialTemplate })}
          />
        ))}
      </Box>
      <CredentialTemplateDialog
        newCredentialTemplateType={selectedNewCredentialType}
        credentialTemplate={selectedTemplate}
        isOpen={isOpen}
        onClose={closeDialog}
        refreshTemplates={refreshCredentialTemplates}
      />
    </Stack>
  );
}
