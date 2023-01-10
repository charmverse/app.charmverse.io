import * as googleDrive from '@googleapis/drive';

import { getClient } from '../authorization/authClient';

// Requires 'https://www.googleapis.com/auth/forms.body.readonly' scope
export async function getForms(refreshToken: string) {
  const forms = _getDriveClient(refreshToken);

  // how to search files: https://developers.google.com/drive/api/guides/search-files
  const res = await forms.files.list({
    q: 'mimeType = "application/vnd.google-apps.form"'
  });

  return res.data;
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
