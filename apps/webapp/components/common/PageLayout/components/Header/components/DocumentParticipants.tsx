import { AvatarGroup, Box, Tooltip } from '@mui/material';
import { useState } from 'react';

import Avatar from 'components/common/Avatar';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useUser } from 'hooks/useUser';

export function DocumentParticipants() {
  const { participants } = useCharmEditor();
  const { user } = useUser();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [participantName, setParticipantName] = useState('');

  const otherParticipants = participants
    .filter((participant) => participant.id !== user?.id)
    // only include the 'primary' participant for each user (each tab is a new "participant")
    .filter((participant) => Boolean(participant.sessionIds) && participant.sessionIds.length > 0);

  return (
    <Box mr={2}>
      <Tooltip title={participantName} placement='bottom' PopperProps={{ anchorEl }} onClose={() => setAnchorEl(null)}>
        <AvatarGroup max={6}>
          {otherParticipants.map((participant) => (
            <Avatar
              key={participant.id}
              onMouseEnter={(event) => {
                setAnchorEl(event.currentTarget);
                setParticipantName(participant.name);
              }}
              avatar={participant.avatar}
              name={participant.name}
              size='small'
            />
          ))}
        </AvatarGroup>
      </Tooltip>
    </Box>
  );
}
