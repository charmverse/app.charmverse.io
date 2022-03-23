
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
import charmClient from 'charmClient';
import { Role } from '@prisma/client';
import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { getDisplayName } from 'lib/users';
import { ElementDeleteIcon } from 'components/common/form/ElementDeleteIcon';

export const schema = yup.object({
  name: yup.string().required('Please provide a valid role name')
});

type FormValues = yup.InferType<typeof schema>

export default function RoleAssignment () {

  const [space] = useCurrentSpace();

  const [roles, setRoles] = useState<Role []>([]);

  useEffect(() => {
    listRoles();
  }, []);

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
    listRoles();
  }

  async function deleteRole (role: Partial<Role>) {
    role.spaceId = space?.id;
    await charmClient.deleteRole({ roleId: role.id, spaceId: role.spaceId });
    listRoles();
  }

  async function listRoles () {
    if (space) {
      const rolesInSpace = await charmClient.listRoles(space.id);
      setRoles(rolesInSpace);
      console.log('Roles and members', rolesInSpace);
    }
  }

  async function assignRole (userId: string, roleId: string) {
    if (space) {
      await charmClient.assignRole({
        roleId,
        userId,
        spaceId: space.id
      });
      listRoles();
    }

  }

  async function unassignRole (userId: string, roleId: string) {
    if (space) {
      await charmClient.unassignRole({
        roleId,
        userId,
        spaceId: space.id
      });
      listRoles();
    }

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
      <Box>
        {
            roles.map(role => {
              return (
                <Box key={role.id}>

                  <Typography variant='h2'>{role.name}
                    <ElementDeleteIcon clicked={() => {
                      deleteRole({ id: role.id });
                    }}
                    />
                  </Typography>

                  {
                    (role as any).spaceRolesToRole?.map(spaceRoleToRole => {
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

                  <Box>

                  </Box>

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
