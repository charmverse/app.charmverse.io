import * as googleDrive from '@googleapis/drive';
import * as googlForms from '@googleapis/forms';

import type { Board, IPropertyOption, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { GoogleFormSourceData } from 'lib/focalboard/boardView';
import { isTruthy } from 'lib/utilities/types';

import { getClient } from '../authClient';
import { getCredential } from '../credentials';

type GoogleForm = googlForms.forms_v1.Schema$Form;
type GoogleFormResponse = googlForms.forms_v1.Schema$FormResponse;

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
export async function syncFormResponses({ sourceData }: { sourceData: GoogleFormSourceData }) {
  const { formId } = sourceData;
  const credential = await getCredential({ credentialId: sourceData.credentialId });
  const forms = _getFormsClient(credential.refreshToken);

  const { data: form } = await forms.forms.get({
    formId
  });

  const cardProperties = getCardProperties(form);

  const res = await forms.forms.responses.list({
    formId
  });
  const { responses } = res.data;
  if (responses) {
    for (const response of responses) {
      const responseId = response.responseId;
      const createdAt = response.createTime;
      const properties = getValuesFromResponse({ formId, properties: cardProperties, response });
      const cardBlock = {
        createdAt,
        fields: {
          properties,
          responseId
        }
      };
    }
  }
  return res.data;
}

const userEmailProperty = 'user_email';
const responseLinkProperty = 'response_link';

function getCardProperties(form: GoogleForm): IPropertyTemplate[] {
  const properties: IPropertyTemplate[] = [
    {
      id: userEmailProperty,
      name: 'Respondent Email',
      type: 'email',
      options: []
    },
    {
      id: responseLinkProperty,
      name: 'Link to response',
      type: 'url',
      options: []
    }
  ];

  form.items?.forEach((item) => {
    const questionId = item?.questionItem?.question?.questionId;

    if (questionId) {
      const choiceQuestion = item.questionItem?.question?.choiceQuestion;
      const options = (choiceQuestion?.options ?? [])
        .map(
          (choice): IPropertyOption => ({
            id: choice.value ?? '',
            value: choice.value ?? '',
            color: ''
          })
        )
        // filter out options like { isOther: true }
        .filter((option) => option.id !== '');

      const hasIsOther = choiceQuestion?.options?.some((option) => option.isOther);
      const prop: IPropertyTemplate = {
        id: questionId,
        name: item.title ?? questionId,
        type: 'text',
        options
      };

      if (choiceQuestion?.type === 'RADIO' || (choiceQuestion?.type === 'DROP_DOWN' && !hasIsOther)) {
        prop.type = 'select';
      } else if (choiceQuestion?.type === 'CHECKBOX') {
        prop.type = 'multiSelect';
      }
      properties.push(prop);
    }
  });

  return properties;
}

function getValuesFromResponse({
  formId,
  properties,
  response
}: {
  formId?: string;
  properties: IPropertyTemplate[];
  response: GoogleFormResponse;
}): Record<string, number | string | string[]> {
  const values: Record<string, number | string | string[]> = {};

  if (response.respondentEmail) {
    values[userEmailProperty] = response.respondentEmail;
  }

  // add the URL to view the response
  values[responseLinkProperty] = `https://docs.google.com/forms/d/${formId}/edit#response=${response.responseId}`;

  Object.values(response.answers ?? {}).forEach((answer) => {
    const question = properties.find((prop) => prop.id === answer.questionId);
    if (question) {
      const propId = question.id;
      if (question.type === 'number' && answer.grade) {
        if (answer.grade.score) {
          values[propId] = answer.grade.score;
        } else {
          values[propId] = answer.grade.correct ? 1 : 0;
        }
      } else if (question.type === 'select' || question.type === 'multiSelect') {
        values[propId] = (answer.textAnswers?.answers ?? []).map((a) => a.value).filter(isTruthy);
      } else if (question.type === 'text') {
        values[propId] = answer.textAnswers?.answers?.[0]?.value ?? '';
      } else {
        // textAnswer is a fallback for all other types
        // https://developers.google.com/forms/api/reference/rest/v1/forms.responses#TextAnswer
        values[propId] = answer.textAnswers?.answers?.[0]?.value ?? '';
      }
    }
  });

  return values;
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
