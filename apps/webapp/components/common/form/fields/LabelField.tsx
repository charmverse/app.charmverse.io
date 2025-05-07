import { Typography } from '@mui/material';

import type { PageContent } from 'lib/prosemirror/interfaces';

import type { FieldWrapperProps } from './FieldWrapper';
import { FieldWrapperContainer, ReadonlyCharmContent } from './FieldWrapper';

type Props = FieldWrapperProps & {
  description?: PageContent;
  label?: string;
};

export function LabelField({ description, label, ...props }: Props) {
  return (
    <FieldWrapperContainer {...props}>
      {label && <Typography variant='h1'>{label}</Typography>}
      <ReadonlyCharmContent content={description} />
    </FieldWrapperContainer>
  );
}
