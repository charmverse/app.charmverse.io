'use client';

import type { OptimismProjectAttestation } from '@charmverse/core/prisma-client';
import { Divider, FormLabel, MenuItem, Select, Stack, Typography } from '@mui/material';

export async function ImportOptimismProject({
  optimismProjects,
  onSelectProject
}: {
  optimismProjects: OptimismProjectAttestation[];
  onSelectProject: (project: OptimismProjectAttestation) => void;
}) {
  if (!optimismProjects.length) {
    return null;
  }

  return (
    <Stack mb={2}>
      <FormLabel id='project-avatar-and-cover-image'>Import a project from Optimism</FormLabel>
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
        onChange={(ev) => {
          const value = (ev.target as HTMLSelectElement).value;
          const project = optimismProjects.find((p) => p.projectRefUID === value);
          if (project) {
            onSelectProject(project);
          }
        }}
      >
        {optimismProjects.map(({ name, projectRefUID }) => (
          <MenuItem key={projectRefUID} value={projectRefUID} sx={{ pl: 5 }}>
            {name}
          </MenuItem>
        ))}
      </Select>
      <Divider sx={{ my: 2 }} />
    </Stack>
  );
}
