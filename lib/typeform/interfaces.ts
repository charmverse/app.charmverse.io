import type { Typeform } from '@typeform/api-client';

import type { IPropertyTemplate } from 'lib/databases/board';

export type TypeformFields = {
  id?: string;
  ref?: string;
  type?: string;
  title?: string;
  description?: string;
  allow_multiple_selections?: boolean;
  choices?: {
    id?: string;
    label?: string;
  }[];
  properties?: Record<string, string>;
};

export interface TypeformResponse extends Typeform.Response {
  definition?: {
    fields?: TypeformFields[];
  };
}

export type BodyFormResponse = {
  question: IPropertyTemplate;
  answer: string | string[];
}[];
