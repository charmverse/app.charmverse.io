import BountyModal from 'components/bounties/BountyModal';
import { useForm } from 'react-hook-form';

import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { PageContent } from 'models';

import BangleEditor from 'components/editor/BangleEditor';
import { useRef } from 'react';
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
