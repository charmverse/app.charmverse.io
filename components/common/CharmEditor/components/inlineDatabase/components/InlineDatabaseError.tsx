import { Box, Stack, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import styled from '@emotion/styled';

const Container = styled.div`
  border: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
  border-left: none;
  border-right: none;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

export default function InlineDatabaseError ({ message }: { message: string}) {
  return (
    <Container>
      <Stack alignItems='center' spacing={0}>
        <ErrorIcon color='secondary' />
        <Typography color='secondary' fontWeight='strong'>{message}</Typography>
      </Stack>
    </Container>
  );
}
