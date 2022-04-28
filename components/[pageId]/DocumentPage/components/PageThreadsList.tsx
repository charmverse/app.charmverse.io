import { Box, BoxProps, List, MenuItem, Select, SelectProps, Typography } from '@mui/material';
import PageThread from 'components/common/CharmEditor/components/PageThread';
import { useThreads } from 'hooks/useThreads';
import { useState } from 'react';
import styled from '@emotion/styled';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';

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

const StyledPageThreadsBox = styled(Box)`
  max-width: 550px;
  height: 100%;
  width: 100%;
`;

const StyledPageThreadsList = styled(List)`
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: 0px;
  padding-bottom: 0px;
  height: calc(100% - 50px);
`;

const EmptyThreadContainerBox = styled(Box)`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.palette.background.light};
`;

export default function PageThreadsList ({ sx, inline, ...props }: BoxProps & {inline?: boolean}) {
  const { threads } = useThreads();
  const allThreads = Object.values(threads);
  const unResolvedThreads = allThreads.filter(thread => thread && !thread.resolved);
  const resolvedThreads = allThreads.filter(thread => thread && thread.resolved);
  const [threadClass, setThreadClass] = useState<'resolved' | 'open'>('open');
  const [threadSort, setThreadSort] = useState<'earliest' | 'latest'>('latest');
  const handleThreadClassChange: SelectProps['onChange'] = (event) => {
    setThreadClass(event.target.value as any);
  };
  const handleThreadListSortChange: SelectProps['onChange'] = (event) => {
    setThreadSort(event.target.value as any);
  };
  const threadsList = (threadClass === 'resolved' ? resolvedThreads : unResolvedThreads).sort((threadA, threadB) => threadA && threadB ? new Date((threadSort === 'earliest' ? threadA : threadB).createdAt).getTime() - new Date((threadSort === 'earliest' ? threadB : threadA).createdAt).getTime() : 0);

  return (
    <StyledPageThreadsBox
      // The className is used to refer to it using regular dom api
      className='PageThreadsList'
      {...props}
      sx={{
        ...(sx ?? {})
      }}
    >
      <Box display='flex' alignItems='center' justifyContent='space-between' mb={1}>
        <Typography variant='h6'>Comments</Typography>
        <Box display='flex' gap={1}>
          <Select variant='outlined' value={threadClass} onChange={handleThreadClassChange}>
            <MenuItem value='open'>Open</MenuItem>
            <MenuItem value='resolved'>Resolved</MenuItem>
          </Select>
          <Select variant='outlined' value={threadSort} onChange={handleThreadListSortChange}>
            <MenuItem value='latest'>Latest</MenuItem>
            <MenuItem value='earliest'>Earliest</MenuItem>
          </Select>
        </Box>
      </Box>
      <StyledPageThreadsList>
        {threadsList.length === 0 ? (
          <EmptyThreadContainerBox>
            <Center>
              <ForumOutlinedIcon
                fontSize='large'
                color='secondary'
                sx={{
                  height: '2em',
                  width: '2em'
                }}
              />
              <Typography variant='subtitle1' color='secondary'>No {threadClass} threads yet</Typography>
            </Center>
          </EmptyThreadContainerBox>
        ) : threadsList.map(resolvedThread => resolvedThread
          && <PageThread showFindButton inline={inline} key={resolvedThread.id} threadId={resolvedThread?.id} />)}
      </StyledPageThreadsList>
    </StyledPageThreadsBox>
  );
}
