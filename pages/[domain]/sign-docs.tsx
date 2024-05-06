import { Alert, Box, Divider, FormLabel, Stack, TextField } from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { POST } from 'adapters/http';
import { Button } from 'components/common/Button';
import { TagSelect } from 'components/common/DatabaseEditor/components/properties/TagSelect/TagSelect';
import { TextInput } from 'components/common/DatabaseEditor/components/properties/TextInput';
import { ScrollableWindow } from 'components/common/PageLayout';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useDocusign } from 'components/signing/hooks/useDocusign';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { isValidEmail } from 'lib/utils/strings';

export default function SignDocs() {
  const {
    docusignOauthUrl,
    docusignProfile,
    docusignTemplates,
    refreshDocusignTemplates,
    templateLoadingError,
    triggerCreateEnvelope,
    envelopes,
    refreshEnvelopes,
    requestSigningLink,
    envelopeSearchResults,
    searchDocusign
  } = useDocusign();

  const [selectedDocusignTemplate, setSelectedDocusignTemplate] = useState<string | null>(null);

  const [signerName, setSignerName] = useState<string>('Mo');
  const [signerEmail, setSignerEmail] = useState<string>('mo@anyahq.co');

  const router = useRouter();

  const disableRequestEnvelope = !selectedDocusignTemplate || !signerName || !signerEmail || !isValidEmail(signerEmail);

  const { space } = useCurrentSpace();

  async function onClickRefreshOAuth() {
    await POST('/api/docusign/refresh-token', { spaceId: space?.id });
    refreshDocusignTemplates();
    refreshEnvelopes();
  }

  async function handleSignDocument(envelopeId: string) {
    const { url } = await requestSigningLink({ envelopeId, spaceId: space?.id as string });

    router.push(url);
  }

  async function createEnvelope() {
    if (!signerEmail || !signerName || !selectedDocusignTemplate) {
      return;
    }

    await triggerCreateEnvelope({
      spaceId: space?.id as string,
      templateId: selectedDocusignTemplate,
      signers: [
        {
          email: signerEmail,
          name: signerName,
          roleName: 'signer'
        }
      ]
    });

    refreshEnvelopes();
  }

  const url = docusignOauthUrl();

  return (
    <ScrollableWindow>
      <h1>SignDocs</h1>

      <Stack>
        <h2>1. Connect Docusign account</h2>

        <Box gap={2} display='flex'>
          <Button href={url} external>
            Connect Docusign Account
          </Button>

          <Button onClick={onClickRefreshOAuth}>Refresh OAuth token</Button>
        </Box>
        {docusignProfile && (
          <Box>
            <h3>Connected Docusign Account</h3>
            <Box>
              <p>Account ID: {docusignProfile.docusignAccountId}</p>
              <p>Account Name: {docusignProfile.docusignAccountName}</p>
            </Box>
          </Box>
        )}
        <Divider></Divider>

        {/* <h2>2. Display templates</h2>

        {docusignTemplates?.map((t) => (
          <Box key={t.templateId}>
            {t.name} - {t.templateId}
          </Box>
        ))}
        {templateLoadingError && (
          <Box>
            Error loading templates
            <Alert severity='error'>{templateLoadingError.message}</Alert>
          </Box>
        )}
        <Divider></Divider>

        <h2>3. Create an envelope from a template</h2>
        {docusignTemplates && (
          <Box>
            <TagSelect
              options={docusignTemplates.map((t) => ({
                color: 'propColorGray',
                id: t.templateId,
                label: t.name,
                value: t.name
              }))}
              multiselect={false}
              propertyValue={selectedDocusignTemplate as any}
              onChange={setSelectedDocusignTemplate as any}
            />
            <FormLabel>Email</FormLabel>
            <TextField value={signerEmail} onChange={setSignerEmail as any}></TextField>
            <FormLabel>Name</FormLabel>
            <TextField value={signerName} onChange={setSignerName as any}></TextField>
            <Button disabled={disableRequestEnvelope} onClick={createEnvelope} sx={{ width: 'fit-content' }}>
              Create docusign
            </Button>
          </Box>
        )}

        <Divider></Divider> */}

        <h2>3. Search envelopes</h2>
        <Box>
          <FormLabel>Search</FormLabel>
          <TextField onChange={(ev) => searchDocusign({ title: ev.target.value })} />
          {envelopeSearchResults?.map((e) => (
            <Box key={e.emailSubject}>
              {e.emailSubject}
              <Button onClick={() => handleSignDocument(e.envelopeId)}>Sign</Button>
            </Box>
          ))}
        </Box>
        <Divider></Divider>

        <h2>4. Interact with a pending envelope</h2>
        <Box>
          {envelopes?.map((e) => (
            <Box key={e.envelopeId}>
              {e.envelopeId}
              <Button onClick={() => handleSignDocument(e.envelopeId)}>View</Button>
            </Box>
          ))}
        </Box>
        <Divider></Divider>

        <h2>5. Show successful signatures</h2>
        <Divider></Divider>
      </Stack>
    </ScrollableWindow>
  );
}

SignDocs.getLayout = getPageLayout;
