
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Input from '@mui/material/Input';
import { Path, UseFormRegister } from 'react-hook-form';
import { InputSearchCollaborator } from './InputSearchCollaborator';
import { InputSearchCrypto } from './InputSearchCrypto';

type NativeHtmlInputType = 'text' |'textMultiline' | 'number'

type CustomInputType = 'crypto' | 'currency' | 'task' | 'collaborators' | 'charmEditor';

type FieldType = NativeHtmlInputType | CustomInputType;

export interface IInputField<T = any> {
  fieldType: FieldType;
  modelKey: keyof T;
  value?: any;
  placeholder?: string;
  required?: boolean;
  label?: string;
}

export interface IGenericInputConfiguration<T = any> {
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
          {...register(fieldConfig.modelKey as Path<T>, {
            value: fieldConfig.value ?? ''
          })}
          required={fieldConfig.required === true}
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
          <Input
            {...register(fieldConfig.modelKey as Path<T>, {
              valueAsNumber: true
            })}
            fullWidth
            type='number'
            inputProps={{ step: 0.000000001 }}
          />
        </>
      );

    default:
      return null;
  }
}
