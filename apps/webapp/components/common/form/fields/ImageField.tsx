import type { PageContent } from '@packages/charmeditor/interfaces';

import { Button } from 'components/common/Button';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';
import ImageSelector from 'components/common/ImageSelector/ImageSelector';

import type { FieldWrapperProps } from './FieldWrapper';
import { FieldWrapper } from './FieldWrapper';

type Props = ControlFieldProps &
  FieldProps &
  FieldWrapperProps & {
    description?: PageContent;
    imageUrl?: string;
  };

export function ImageField({ value, ...props }: Props) {
  return (
    <FieldWrapper {...props}>
      <ImageSelector
        closeOnImageSelect
        onImageSelect={(newValue) => (props.onChange && newValue ? props.onChange(newValue) : null)}
      >
        <Button disabled={props.disabled} sx={{ my: 2 }} color='primary' size='small'>
          Choose image
        </Button>
      </ImageSelector>
      {value && <img style={{ maxWidth: '100%' }} src={value as string} alt='user submission' />}
    </FieldWrapper>
  );
}
