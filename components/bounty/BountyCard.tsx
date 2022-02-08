import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';

interface BountyCardProps {
  // TODO: define the key later
  id: number;
  title: string;
  // TODO: update this to enum with later requirement
  status: string;
  // TODO: update this to enum with later requirement
  type: string;
}

export default function BountyCard ({
  id,
  title,
  status,
  type
}: BountyCardProps) {
  return (
    <Box
      key={id}
      sx={{
        width: 290,
        height: 228,
        borderRadius: 10,
        border: '1px solid'
      }}
    >
      {title}
      <Stack direction='row' spacing={1}>
        <Chip label={status} />
        <Chip label={type} />
      </Stack>
      <Button>APPLY</Button>
    </Box>
  );
}
