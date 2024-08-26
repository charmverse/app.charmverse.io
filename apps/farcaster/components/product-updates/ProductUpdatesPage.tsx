'use client';

import { FarcasterCard } from '@connect-shared/components/common/FarcasterCard';
import { Card, FormLabel } from '@mui/material';
import { Stack } from '@mui/system';
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
      <Card>
        <FarcasterCard
          fid={farcasterUser.fid}
          name={farcasterUser.display_name}
          username={farcasterUser.username}
          avatar={farcasterUser.pfp_url}
          bio={farcasterUser.profile.bio.text}
        />
      </Card>
      <Stack>
        <FormLabel id='projectId'>Project</FormLabel>
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
            onCreateProject={() => {
              setIsCreatingProject(true);
            }}
            projectId={defaultProjectId}
            connectProjects={connectProjects}
            farcasterUser={farcasterUser}
          />
        )}
      </Stack>
    </Stack>
  );
}
