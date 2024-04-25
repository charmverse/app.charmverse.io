import { Box, Divider, Stack } from '@mui/material';

import { Button } from 'components/common/Button';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useDocusign } from 'components/signing/hooks/useDocusign';

export default function SignDocs() {
  const { docusignOauthUrl } = useDocusign();

  const url = docusignOauthUrl();

  return (
    <div>
      <h1>SignDocs</h1>

      <Stack>
        <h2>1. Connect Docusign account</h2>

        <Box>
          <Button href={url} external>
            Connect Docusign Account
          </Button>
        </Box>
        <Divider></Divider>

        <h2>2. Display templates</h2>
        <Divider></Divider>

        <h2>3. Create an envelope from a template</h2>
        <Divider></Divider>

        <h2>4. Interact with a pending envelope</h2>
        <Divider></Divider>

        <h2>5. Show successful signatures</h2>
        <Divider></Divider>
      </Stack>
    </div>
  );
}

SignDocs.getLayout = getPageLayout;
