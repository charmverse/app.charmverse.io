import { Typography } from '@mui/material';

import { CharmEditor } from 'components/common/CharmEditor';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { FieldWrapperProps } from './FieldWrapper';
import { FieldWrapperContainer } from './FieldWrapper';

type Props = FieldWrapperProps & {
  description?: PageContent;
  label?: string;
};

export function LabelField({ description, label, ...props }: Props) {
  return (
    <FieldWrapperContainer {...props}>
      {label && <Typography variant='h1'>{label}</Typography>}
      {description && !checkIsContentEmpty(description) ? (
        <CharmEditor readOnly isContentControlled content={description as PageContent} />
      ) : null}
    </FieldWrapperContainer>
  );
}
