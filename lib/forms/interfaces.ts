import type { FormFieldType, MemberPropertyType, FormField } from '@charmverse/core/prisma';
import type { PageContent } from '@root/lib/prosemirror/interfaces';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { UploadedFileInfo } from 'hooks/useS3UploadInput';

// used by charm editor
export type LongTextValue = {
  content: PageContent;
  contentText: string;
};

export type ProjectFieldValue = {
  projectId: string;
  selectedMemberIds: string[];
};

export type OpProjectFieldValue = {
  projectTitle: string;
  projectRefUID: string;
};

export type FormFieldValue =
  | string
  | string[]
  | LongTextValue
  | UploadedFileInfo
  | ProjectFieldValue
  | OpProjectFieldValue;

export type FieldType = MemberPropertyType | FormFieldType;

export type FormFieldInput = Pick<
  FormField,
  'id' | 'description' | 'name' | 'index' | 'required' | 'private' | 'type' | 'fieldConfig'
> & {
  options?: SelectOptionType[];
};

export type FieldAnswerInput = {
  id?: string;
  fieldId: string;
  value: FormFieldValue;
};
