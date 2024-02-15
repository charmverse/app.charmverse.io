import { Typography } from '@mui/material';

import ImageSelector from 'components/common/ImageSelector/ImageSelector';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { FieldWrapperProps } from './FieldWrapper';
import { FieldWrapperContainer, ReadonlyCharmContent } from './FieldWrapper';

type Props = FieldWrapperProps & {
  description?: PageContent;
  imageUrl?: string;
};

export function ImageField({ description, label, ...props }: Props) {
  return (
    <FieldWrapperContainer {...props}>
      <ImageSelector onImageSelect={}>
        <div>content</div>
      </ImageSelector>
      {label && <Typography variant='h1'>{label}</Typography>}
      <ReadonlyCharmContent content={description} />
    </FieldWrapperContainer>
  );
}
