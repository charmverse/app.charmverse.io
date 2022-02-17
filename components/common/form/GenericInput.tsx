
import { useRef } from 'react';
import { Controller, Path, useForm, UseFormRegister } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import BangleEditor from 'components/editor/BangleEditor';
import { Typography } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { InputSearchCrypto } from './InputSearchCrypto';
import { InputSearchCurrency } from './InputSearchCurrency';
import { InputSearchCollaborator } from './InputSearchCollaborator';

type NativeHtmlInputType = 'text' |'textMultiline' | 'number'

type CustomInputType = 'crypto' | 'currency' | 'task' | 'collaborators' | 'charmEditor';

type FieldType = NativeHtmlInputType | CustomInputType;

export interface IInputField<T = any> {
  fieldType: FieldType;
  modelKey: keyof T;
  placeholder?: string;
  required?: boolean;
  label?: string;
}

export interface IGenericInputConfiguration<T = any> {
  key: string
  fieldConfig: IInputField,
  register: UseFormRegister<T>
}

export function GenericInput<T = any> ({ register, fieldConfig }: IGenericInputConfiguration<T>) {

  switch (fieldConfig.fieldType) {
    case 'crypto':
      return <InputSearchCrypto modelKey={fieldConfig.modelKey as string} register={register} onChange={() => {}} />;

    case 'text':
      return (
        <TextField
          {...register(fieldConfig.modelKey as Path<T>)}
          fullWidth
          placeholder={fieldConfig.placeholder}
          variant='outlined'
          label={fieldConfig.label}
        />
      );

    case 'textMultiline':
      return (
        <TextField
          {...register(fieldConfig.modelKey as Path<T>)}
          fullWidth
          multiline
          placeholder={fieldConfig.placeholder}
          variant='outlined'
          label={fieldConfig.label}
        />
      );

      /*
    case 'charmEditor':
      return (
        <Controller
          control={control}
          name={fieldConfig.modelKey as string}
          // eslint-disable-next-line react/no-unstable-nested-components
          render={({ field: { onChange } }) => (
            <>
              <InputLabel>{fieldConfig.label ?? 'Charmverse editor'}</InputLabel>
              <Typography paragraph={true}></Typography>
              <BangleEditor
                onPageContentChange={(data) => {
                  ref(data);
                  inputRef.current = data;
                }}
              />
            </>
          )}
        />
      );
    */

    case 'collaborators':
      return (
        <>
          <InputLabel>{fieldConfig.label ?? 'Collaborators'}</InputLabel>
          <InputSearchCollaborator />
        </>
      );

    case 'number':
      return (
        <>
          <InputLabel>
            {fieldConfig.label ?? 'Amount'}
          </InputLabel>
          <TextField
            {...register(fieldConfig.modelKey as Path<T>)}
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          />
        </>
      );

    default:
      return null;
  }
}
