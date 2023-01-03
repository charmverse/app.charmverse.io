import { Card, Grid, Box, ListItemIcon, MenuItem, Typography } from '@mui/material';
import { useState } from 'react';
import useSwr from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import type { CredentialItem } from 'pages/api/google/forms/credentials';

import { GoogleConnectButton } from './GoogleConnectButton';

export function GoogleForms() {
  const { data: credentials, mutate } = useSwr('google_credentials', () => charmClient.google.forms.getCredentials());
  const [selectedCredential, setSelectedCredential] = useState<CredentialItem | null>(null);
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
        <GoogleConnectButton onConnect={onConnect} />
        <Typography variant='caption'>Find and embed your Google forms</Typography>
      </Box>
    );
  } else if (selectedCredential) {
    return <GoogleFormSelect credential={selectedCredential} onSelect={selectForm} />;
  }
  return (
    <>
      {credentials.map((credential) => (
        <MenuItem key={credential.id} onClick={() => selectCredential(credential)}>
          Choose from {credential.name}
        </MenuItem>
      ))}
      <GoogleConnectButton onConnect={onConnect} />
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
        <MenuItem key={form.id} onClick={() => onSelect(form)}>
          Choose from {form.name}
        </MenuItem>
      ))}
    </>
  );
}
