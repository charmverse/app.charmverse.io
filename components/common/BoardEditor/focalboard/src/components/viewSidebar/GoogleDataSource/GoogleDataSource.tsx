import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { Box, MenuItem, ListItemIcon, ListItemText, Tooltip, Typography } from '@mui/material';
import Script from 'next/script';
import { useState } from 'react';
import useSwr from 'swr';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import type { CredentialItem } from 'pages/api/google/forms/credentials';

import { googleIdentityServiceScript, useGoogleAuth } from './hooks/useGoogleAuth';

export function GoogleDataSource() {
  const { data: credentials, mutate } = useSwr('google_credentials', () => charmClient.google.forms.getCredentials());
  const [selectedCredential, setSelectedCredential] = useState<CredentialItem | null>(null);
  const { loginWithGoogle, onLoadScript } = useGoogleAuth({ onConnect });
  function onConnect() {
    mutate();
  }

  function selectCredential(credential: CredentialItem) {
    setSelectedCredential(credential);
  }

  function selectForm(form: { id: string }) {
    setSelectedCredential(null);
  }

  if (!credentials) return <LoadingComponent />;
  if (credentials.length === 0) {
    return (
      <Box px={3} mt={3}>
        <Script src={googleIdentityServiceScript} onReady={onLoadScript} />
        <MenuItem onClick={loginWithGoogle} color='primary'>
          Connect Google Account
        </MenuItem>
        <Typography variant='caption'>Find and embed your Google forms</Typography>
      </Box>
    );
  } else if (selectedCredential) {
    return <GoogleFormSelect credential={selectedCredential} onSelect={selectForm} />;
  }
  return (
    <>
      <Script src={googleIdentityServiceScript} onReady={onLoadScript} />
      {credentials.map((credential) => (
        <MenuItem divider dense key={credential.id} onClick={() => selectCredential(credential)}>
          Choose from {credential.name}
        </MenuItem>
      ))}
      <MenuItem dense sx={{ color: 'text.secondary' }} onClick={loginWithGoogle} color='secondary'>
        Connect another account
      </MenuItem>
    </>
  );
}

function GoogleFormSelect({
  credential,
  onSelect
}: {
  credential: CredentialItem;
  onSelect: (form: { id: string }) => void;
}) {
  const { data: forms, mutate } = useSwr(`google_credentials/${credential.id}`, () =>
    charmClient.google.forms.getForms({ credentialId: credential.id })
  );
  if (!forms) return <LoadingComponent />;
  return (
    <>
      {forms.map((form) => (
        <Tooltip key={form.id} title={form.name} enterDelay={1000}>
          <MenuItem dense onClick={() => onSelect(form)}>
            <ListItemIcon>
              <FormatListBulletedIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText primary={form.name} />
          </MenuItem>
        </Tooltip>
      ))}
    </>
  );
}
