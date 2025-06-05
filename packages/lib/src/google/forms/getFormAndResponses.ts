import { log } from '@charmverse/core/log';
import * as googlForms from '@googleapis/forms';
import type { GoogleFormSourceData } from '@packages/databases/board';

import { getClient } from '../authorization/authClient';
import { getCredentialToken } from '../authorization/credentials';

type GoogleFormResponse = googlForms.forms_v1.Schema$FormResponse;

export async function getFormAndResponses(sourceData: GoogleFormSourceData, lastUpdated: Date | null) {
  const { formId } = sourceData;
  const refreshToken = await getCredentialToken(sourceData);
  const forms = _getFormsClient(refreshToken);

  const { data: form } = await forms.forms.get({
    formId
  });

  const reqBody: googlForms.forms_v1.Params$Resource$Forms$Responses$List = {
    formId,
    filter: lastUpdated ? `timestamp >= ${lastUpdated.toISOString()}` : undefined
  };
  const responses: GoogleFormResponse[] = [];

  let maxCalls = 20; // avoid endless loop
  while ((!reqBody.hasOwnProperty('pageToken') || reqBody.pageToken) && maxCalls > 0) {
    const res = await forms.forms.responses.list(reqBody);
    if (res.data.responses) {
      responses.push(...res.data.responses);
    }
    reqBody.pageToken = res.data.nextPageToken ?? undefined;
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
  return googlForms.forms('v1');
}
