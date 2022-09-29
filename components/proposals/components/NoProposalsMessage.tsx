
import styled from '@emotion/styled';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Box, Typography } from '@mui/material';

const EmptyProposalContainerBox = styled(Box)`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.palette.background.light};
`;

const Center = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

export default function NoProposalsMessage ({ message }: { message: string }) {
  return (
    <EmptyProposalContainerBox>
      <Center>
        <TaskOutlinedIcon
          fontSize='large'
          color='secondary'
          sx={{
            height: '2em',
            width: '2em'
          }}
        />
        <Typography variant='subtitle1' color='secondary'>{message}</Typography>
      </Center>
    </EmptyProposalContainerBox>
  );
}
