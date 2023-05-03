import type { Typeform } from '@typeform/api-client';

import type { FormResponseProperty } from 'lib/pages';

export interface TypeformFields {
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
}

export interface TypeformResponse extends Typeform.Response {
  definition?: {
    fields?: TypeformFields[];
  };
}

export type BodyFormResponse = {
  question: FormResponseProperty;
  answer: string | string[];
}[];
