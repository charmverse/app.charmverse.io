import * as googleDrive from '@googleapis/drive';
import * as googlForms from '@googleapis/forms';

import { getClient } from '../authClient';

type Credential = {
  refreshToken: string;
};

// export type GoogleForm = googlForms.forms_v1.Schema$Form;

// Requires 'https://www.googleapis.com/auth/forms.body.readonly' scope
export async function getForms(credential: Credential) {
  const forms = _getDriveClient(credential.refreshToken);

  // how to search files: https://developers.google.com/drive/api/guides/search-files
  const res = await forms.files.list({
    q: 'mimeType = "application/vnd.google-apps.form"'
  });

  return res.data;
}

// Requires 'https://www.googleapis.com/auth/forms.responses.readonly' scope
export async function syncFormResponses({
  googleFormId,
  credential
}: {
  googleFormId: string;
  credential: Credential;
}) {
  const forms = _getFormsClient(credential.refreshToken);

  const res = await forms.forms.responses.list({
    formId: googleFormId
  });
  return res.data;
}

function _getFormsClient(refreshToken: string) {
  const auth = getClient();
  auth.setCredentials({
    refresh_token: refreshToken
  });
  return googlForms.forms({
    version: 'v1',
    auth
  });
}

function _getDriveClient(refreshToken: string) {
  const auth = getClient();
  auth.setCredentials({
    refresh_token: refreshToken
  });
  return googleDrive.drive({
    version: 'v3',
    auth
  });
}
