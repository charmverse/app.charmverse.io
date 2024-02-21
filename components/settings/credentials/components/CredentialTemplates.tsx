import type { AttestationType, CredentialTemplate } from '@charmverse/core/prisma-client';
import { Tooltip } from '@mui/material';
import Stack from '@mui/material/Stack';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import { useGetCredentialTemplates } from 'charmClient/hooks/credentials';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { Typography } from 'components/common/Typography';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { CredentialTemplateDialog } from './CredentialTemplateDialog';
import { CredentialTemplateRow } from './CredentialTemplateRow';

export function CredentialTemplates() {
  const { space } = useCurrentSpace();
  const { getFeatureTitle } = useSpaceFeatures();

  const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate | null>(null);

  const [selectedNewCredentialType, setSelectedNewCredentialType] = useState<AttestationType | null>(null);

  const isAdmin = useIsAdmin();
  const { showMessage } = useSnackbar();

  const { credentialTemplates, refreshCredentialTemplates, proposalCredentialTemplates, rewardCredentialTemplates } =
    useGetCredentialTemplates({
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
    <Stack display='flex' flexDirection='column'>
      <Typography variant='body1'>
        Create credentials with EAS attestations to be awarded for {getFeatureTitle('Proposals').toLowerCase()} or{' '}
        {getFeatureTitle('Rewards').toLowerCase()}
      </Typography>
      {proposalCredentialTemplates?.map((template) => (
        <CredentialTemplateRow
          key={template.id}
          template={template}
          onClickDelete={handleDelete}
          onClickEdit={(credentialTemplate) => openDialog({ template: credentialTemplate })}
        />
      ))}

      <Tooltip title={!isAdmin ? 'Only space admins can create credentials' : ''} arrow>
        <Button
          onClick={() => openDialog({ newTemplateType: 'proposal' })}
          variant='text'
          sx={{ width: 'fit-content' }}
          dataTest='add-proposal-credential'
        >
          + Add a {getFeatureTitle('proposal')} credential
        </Button>
      </Tooltip>

      {rewardCredentialTemplates?.map((template) => (
        <CredentialTemplateRow
          key={template.id}
          template={template}
          onClickDelete={handleDelete}
          onClickEdit={(credentialTemplate) => openDialog({ template: credentialTemplate })}
        />
      ))}
      <Tooltip title={!isAdmin ? 'Only space admins can create credentials' : ''} arrow>
        <Button
          onClick={() => openDialog({ newTemplateType: 'reward' })}
          variant='text'
          sx={{ width: 'fit-content' }}
          dataTest='add-proposal-credential'
        >
          + Add a {getFeatureTitle('reward')} credential
        </Button>
      </Tooltip>
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
