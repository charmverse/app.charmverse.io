import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import styled from '@emotion/styled';

// xtungvo TODO: apply theme changes
const StyledTitled = styled.div`
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  font-weight: bold;
  font-size: 20px;
  line-height: 23px;
  color: #696773;
  flex-grow: 1;
`;

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
        border: '1px solid',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <StyledTitled>
        {title}
      </StyledTitled>
      <Stack direction='row' spacing={2} mt={2}>
        <Chip label={status} color='primary' />
        <Chip label={type} color='secondary' />
      </Stack>
      <Button variant='outlined' sx={{ marginTop: '16px', width: '120px', alignSelf: 'flex-end' }} onClick={() => { }}>APPLY</Button>
    </Box>
  );
}
