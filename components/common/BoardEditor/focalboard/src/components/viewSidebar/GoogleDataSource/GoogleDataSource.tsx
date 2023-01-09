import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ReportProblemIcon from '@mui/icons-material/ReportProblemOutlined';
import { Alert, Box, MenuItem, ListItemIcon, ListItem, ListItemText, Tooltip, Typography, Link } from '@mui/material';
import Script from 'next/script';
import type { MouseEventHandler } from 'react';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import useSwr from 'swr';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import type { BoardViewFields } from 'lib/focalboard/boardView';
import log from 'lib/log';
import type { CredentialItem } from 'pages/api/google/credentials';
import type { GoogleFormItem } from 'pages/api/google/forms';

import { googleIdentityServiceScript, useGoogleAuth } from './hooks/useGoogleAuth';

type Props = {
  activeCredential?: string;
  activeFormId?: string;
  onSelect: (source: Required<Pick<BoardViewFields, 'sourceData' | 'sourceType'>>) => void;
};

export function GoogleDataSource(props: Props) {
  const { data: credentials, mutate } = useSwr('google-credentials', () => charmClient.google.forms.getCredentials());
  const [selectedCredential, setSelectedCredential] = useState<CredentialItem | null>(null);
  const { loginWithGoogle, onLoadScript } = useGoogleAuth({
    onConnect: async (credential) => {
      await mutate();
      selectCredential(credential);
    }
  });

  function selectCredential(credential: CredentialItem) {
    setSelectedCredential(credential);
  }

  if (!credentials) {
    return <LoadingComponent size={30} minHeight={60} />;
  }

  if (credentials.length === 0) {
    return (
      <>
        <Script src={googleIdentityServiceScript} onReady={onLoadScript} />
        <ConnectButton onClick={() => loginWithGoogle()} label='Connect Google Account' />
        <ListItem>
          <Typography variant='caption'>Find and embed your Google forms</Typography>
        </ListItem>
        <GoogleAuthWarning />
      </>
    );
  } else if (selectedCredential) {
    return (
      <GoogleFormSelect
        activeFormId={props.activeFormId}
        credential={selectedCredential}
        loginWithGoogle={loginWithGoogle}
        onSelect={props.onSelect}
      />
    );
  }
  return (
    <>
      <Script src={googleIdentityServiceScript} onReady={onLoadScript} />
      {credentials.map((credential) => (
        <MenuItem
          selected={props.activeCredential === credential.id}
          divider
          dense
          key={credential.id}
          onClick={() => selectCredential(credential)}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Choose from
            <Tooltip disableInteractive title={credential.name}>
              <span> {credential.name}</span>
            </Tooltip>
          </span>
        </MenuItem>
      ))}
      <MenuItem dense sx={{ color: 'text.secondary' }} onClick={() => loginWithGoogle()} color='secondary'>
        Connect another account
      </MenuItem>
      <GoogleAuthWarning />
    </>
  );
}

function GoogleAuthWarning() {
  return (
    <Alert severity='warning'>
      <Typography variant='body1'>Unverified Google app</Typography>
      <Typography variant='body2'>This feature is in beta while our app is under review</Typography>
    </Alert>
  );
}

function ConnectButton({
  label = 'Connect Google Account',
  onClick
}: {
  label?: string;
  onClick?: MouseEventHandler<HTMLLIElement>;
}) {
  return (
    <MenuItem onClick={onClick}>
      <ListItemIcon>
        <FcGoogle fontSize='large' />
      </ListItemIcon>
      <Typography color='primary' variant='body2' fontWeight='bold'>
        {label}
      </Typography>
    </MenuItem>
  );
}

function GoogleFormSelect({
  activeFormId,
  credential,
  loginWithGoogle,
  onSelect
}: {
  activeFormId?: string;
  credential: CredentialItem;
  loginWithGoogle: (options: { hint?: string }) => void;
  onSelect: Props['onSelect'];
}) {
  const { data: forms, error } = useSwr(`google-credentials/${credential.id}`, () =>
    charmClient.google.forms.getForms({ credentialId: credential.id })
  );

  function selectForm(form: GoogleFormItem) {
    const sourceData: { credentialId: string; formId: string; formName: string; formUrl: string } = {
      credentialId: credential.id,
      formId: form.id,
      formName: form.name,
      formUrl: form.url
    };
    onSelect({ sourceData, sourceType: 'google_form' });
  }

  if (error) {
    if (error.status === 401) {
      return (
        <>
          <ConnectButton label='Reconnect Account' onClick={() => loginWithGoogle({ hint: credential.name })} />
          <ListItem>
            <Box display='flex' gap={2} justifyContent='center'>
              <ReportProblemIcon sx={{ color: 'var(--danger-text)' }} fontSize='small' />
              <Typography color='secondary' variant='caption'>
                Authorization been denied. Please reconnect your Google account with the correct permissions.
              </Typography>
            </Box>
          </ListItem>
        </>
      );
    }
    log.error('Error loading forms', error);
    return (
      <ListItem>
        <Typography color='error'>Error loading forms</Typography>
      </ListItem>
    );
  }
  if (!forms) {
    return <LoadingComponent size={30} minHeight={60} />;
  }
  if (forms.length === 0) {
    return (
      <ListItem>
        <Typography color='text.secondary'>No forms found</Typography>
      </ListItem>
    );
  }
  return (
    <>
      {forms.map((form) => (
        <Tooltip key={form.id} title={form.name} enterDelay={1000}>
          <MenuItem dense selected={form.id === activeFormId} onClick={() => selectForm(form)}>
            <ListItemIcon>
              <FormatListBulletedIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText
              primary={
                <Link color='inherit' onClick={(e) => e.nativeEvent.preventDefault()} href={form.url}>
                  {form.name}
                </Link>
              }
            />
          </MenuItem>
        </Tooltip>
      ))}
    </>
  );
}
