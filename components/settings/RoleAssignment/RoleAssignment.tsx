
import Legend from 'components/settings/Legend';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { InputSearchContributor } from 'components/common/form/InputSearchContributor';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { getDisplayName } from 'lib/users';
import { ElementDeleteIcon } from 'components/common/form/ElementDeleteIcon';
import useRoles from 'hooks/useRoles';

export const schema = yup.object({
  name: yup.string().required('Please provide a valid role name')
});

type FormValues = yup.InferType<typeof schema>

export default function RoleAssignment () {
  const {
    assignRole,
    createRole,
    deleteRole,
    listRoles,
    unassignRole,
    roles
  } = useRoles();

  useEffect(() => {
    listRoles();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

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
      <Box>
        {
          roles.map(role => {
            return (
              <Box key={role.id}>

                <Typography variant='h2'>{role.name}
                  <ElementDeleteIcon clicked={() => {
                    deleteRole(role.id);
                  }}
                  />
                </Typography>

                {
                  (role).spaceRolesToRole?.map(spaceRoleToRole => {
                    return (
                      <p>{getDisplayName(spaceRoleToRole?.spaceRole?.user)}
                        <ElementDeleteIcon
                          clicked={() => {
                            unassignRole(spaceRoleToRole?.spaceRole?.user?.id, role.id);
                          }}
                        />
                      </p>
                    );
                  })
                }

                <br />
                <InputSearchContributor onChange={(userId) => {
                  assignRole(userId, role.id);
                }}
                />
              </Box>
            );
          })
        }
      </Box>
    </>
  );
}
