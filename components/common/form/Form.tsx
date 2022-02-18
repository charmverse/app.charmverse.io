import Grid from '@mui/material/Grid';
import PrimaryButton from 'components/common/PrimaryButton';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { v4 } from 'uuid';
import { GenericInput, IInputField } from './GenericInput';

export type FormMode = 'create' | 'update';

export interface ICompositeFormInput<T = any> {
  onSubmit: (values: T) => any
  fields: IInputField [],
  mode?: FormMode
  submitLabel?: string
}

export function CompositeForm ({ onSubmit, fields, mode, submitLabel }: ICompositeFormInput) {

  const renders = useRef(0);

  renders.current += 1;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm();

  // const formValue = watch();

  return (

    <>
      {/* TODO - Delete later. Keep this for now
      <p>
        Renders
        {' '}
        {renders.current}
      </p>
 */}

      <Grid container direction='row' rowSpacing={2}>
        <form onSubmit={handleSubmit(onSubmit)}>

          {
        fields.map(field => {
          return (
            <Grid key={field.modelKey as string + v4()} item sx={{ marginTop: '10px' }}>
              <GenericInput register={register} fieldConfig={field} />
            </Grid>
          );
        })
      }

          <PrimaryButton type='submit'>
            {submitLabel ?? (mode === 'update' ? 'Update' : 'Create')}
          </PrimaryButton>

        </form>
      </Grid>
    </>
  );

}
