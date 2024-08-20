import { Divider, FormLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { Controller, type Control } from 'react-hook-form';

import type { OptimismProjectWithMembers } from 'lib/projects/fetchUnimportedOptimismProjectsAction';
import type { FormValues } from 'lib/projects/schema';

export function ImportOptimismProject({
  control,
  optimismProjects,
  handleProjectSelect
}: {
  control: Control<FormValues>;
  optimismProjects: OptimismProjectWithMembers[];
  handleProjectSelect: (value: OptimismProjectWithMembers) => void;
}) {
  if (!optimismProjects.length) {
    return null;
  }

  return (
    <Stack mb={2}>
      <FormLabel id='project-avatar-and-cover-image'>Import a project from Optimism</FormLabel>
      <Controller
        control={control}
        name='projectRefUIDToImport'
        render={({ field }) => (
          <Select
            displayEmpty
            fullWidth
            aria-labelledby='project-category'
            data-test='project-form-category'
            renderValue={(value: any) =>
              optimismProjects.find((p) => p.projectRefUID === value)?.name || (
                <Typography color='secondary'>Select a project to import</Typography>
              )
            }
            {...field}
            onChange={(e) => {
              field.onChange(e);
              const value = e.target.value as string;

              if (value) {
                const project = optimismProjects.find((p) => p.projectRefUID === value);

                if (project) {
                  handleProjectSelect(project);
                }
              }
            }}
          >
            {optimismProjects.map(({ name, projectRefUID }) => (
              <MenuItem key={projectRefUID} value={projectRefUID}>
                {name}
              </MenuItem>
            ))}
          </Select>
        )}
      />

      <Divider sx={{ my: 2 }} />
    </Stack>
  );
}
