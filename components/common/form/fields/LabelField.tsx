import { Typography } from '@mui/material';

import { CharmEditor } from 'components/common/CharmEditor';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { FieldWrapperContainer } from './FieldWrapper';

type Props = {
  description?: PageContent;
  label?: string;
};

export function LabelField({ description, label }: Props) {
  return (
    <FieldWrapperContainer>
      {label && <Typography variant='h1'>{label}</Typography>}
      {description && !checkIsContentEmpty(description) ? (
        <CharmEditor readOnly isContentControlled content={description as PageContent} />
      ) : null}
    </FieldWrapperContainer>
  );
}
