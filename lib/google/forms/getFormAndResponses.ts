import * as googlForms from '@googleapis/forms';

import type { GoogleFormSourceData } from 'lib/focalboard/boardView';
import log from 'lib/log';

import { getClient } from '../authorization/authClient';
import { getCredentialToken } from '../authorization/credentials';

type GoogleFormResponse = googlForms.forms_v1.Schema$FormResponse;

export async function getFormAndResponses(sourceData: GoogleFormSourceData, lastUpdated: Date | null = new Date(1970)) {
  const { formId } = sourceData;
  const refreshToken = await getCredentialToken(sourceData);
  const forms = _getFormsClient(refreshToken);

  const { data: form } = await forms.forms.get({
    formId
  });

  // retrieve only the latest responses since we last updated
  let pageToken: string | null | undefined = 'default';
  const responses: GoogleFormResponse[] = [];
  let maxCalls = 20; // avoid endless loop
  while (pageToken && maxCalls > 0) {
    const res = await forms.forms.responses.list({
      filter: lastUpdated ? `timestamp >= ${lastUpdated.toISOString()}` : undefined,
      formId
    });
    if (res.data.responses) {
      responses.push(...res.data.responses);
    }
    pageToken = res.data.nextPageToken;
    maxCalls -= 1;
  }

  // should never happen, but let us know if it does
  if (maxCalls === 0) {
    log.error(
      'Reached max calls when checking for Google form responses. Check if it is safe to increase the limit',
      sourceData
    );
  }
  return { form, responses };
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
