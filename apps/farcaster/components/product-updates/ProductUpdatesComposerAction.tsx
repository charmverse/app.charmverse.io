'use client';

import { FarcasterCard } from '@connect-shared/components/common/FarcasterCard';
import { Card, FormLabel } from '@mui/material';
import { Stack } from '@mui/system';
import type { FarcasterUser } from '@root/lib/farcaster/getFarcasterUsers';
import { useState } from 'react';

import type { ConnectProjectMinimal } from 'lib/projects/getConnectProjectsByFid';

import { CreateProjectForm } from '../projects/CreateProjectForm';

import { ProductUpdatesCreateFrameForm } from './components/ProductUpdatesCreateFrameForm';

export function ProductUpdatesComposerAction({
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
            <CreateProjectForm
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
          <ProductUpdatesCreateFrameForm
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
