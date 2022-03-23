
import Legend from 'components/settings/Legend';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import charmClient from 'charmClient';
import { Role } from '@prisma/client';

export const schema = yup.object({
  name: yup.string().required('Please provide a valid role name')
});

type FormValues = yup.InferType<typeof schema>

export default function RoleAssignment () {

  const [space] = useCurrentSpace();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, touchedFields, isValid, isValidating, isSubmitting }
  } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  async function createRole (role: Partial<Role>) {
    role.spaceId = space?.id;
    const createdRole = await charmClient.createRole(role);
    console.log('Created new role', createdRole);
  }

  return (
    <>
      <Legend>
        Role Assignment
      </Legend>

      <div>
        <form
          onSubmit={handleSubmit(formValue => {
            createRole(formValue);
            console.log(formValue);
          })}
          style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}
        >
          <Grid container direction='column' spacing={3}>

            <Grid item>
              <InputLabel>
                Role name
              </InputLabel>
              <TextField
                {...register('name')}
                autoFocus
                placeholder='Bounty manager'
                variant='outlined'
                type='text'
                fullWidth
              />
              {
              errors?.name && (
              <Alert severity='error'>
                {errors.name.message}
              </Alert>
              )
            }

            </Grid>

            <Grid item>
              <Button disabled={!isValid} type='submit'>Create role</Button>
            </Grid>

          </Grid>

        </form>
      </div>
    </>
  );

}
