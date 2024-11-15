'use client';

import { Stack } from '@mui/material';
import type { FarcasterUser } from '@root/lib/farcaster/getFarcasterUsers';
import { useState } from 'react';

import type { ConnectProjectMinimal } from 'lib/projects/getConnectProjectsByFid';

import { NewProductUpdateForm } from './components/NewProductUpdateForm';
import { NewProjectForm } from './components/NewProjectForm';

export function ProductUpdatesPage({
  farcasterUser,
  connectProjects
}: {
  farcasterUser: FarcasterUser;
  connectProjects: ConnectProjectMinimal[];
}) {
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [defaultProjectId, setDefaultProjectId] = useState(connectProjects[0]?.id || '');
  return (
    <Stack gap={2}>
      <Stack>
        {isCreatingProject ? (
          <Stack gap={1}>
            <NewProjectForm
              fid={farcasterUser.fid}
              onCancel={() => {
                setIsCreatingProject(false);
              }}
              onSubmit={(createdProjectId) => {
                setDefaultProjectId(createdProjectId);
                setIsCreatingProject(false);
              }}
            />
          </Stack>
        ) : (
          <NewProductUpdateForm
            onClickCreateProject={() => setIsCreatingProject(true)}
            projectId={defaultProjectId}
            connectProjects={connectProjects}
            farcasterUser={farcasterUser}
          />
        )}
      </Stack>
    </Stack>
  );
}
