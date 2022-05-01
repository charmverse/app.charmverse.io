import styled from '@emotion/styled';
import { Box, Button } from '@mui/material';
import charmClient from 'charmClient';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { mutate } from 'swr';

const StyledPageDeleteBanner = styled(Box)`
  position: fixed;
  top: 55px;
  width: calc(100% - 300px);
  z-index: 2500;
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.palette.error.main};
  padding: ${({ theme }) => theme.spacing(1)};
`;

export default function PageDeleteBanner ({ pageId }: {pageId: string}) {
  const [space] = useCurrentSpace();
  const [isMutating, setIsMutating] = useState(false);
  const dispatch = useAppDispatch();
  const { pages } = usePages();
  const router = useRouter();

  async function deletePage () {
    setIsMutating(true);
    await charmClient.deletePage(pageId);
    await mutate(`pages/${space?.id}`);
    // Route to the first alive page
    router.push(`/${router.query.domain}/${Object.values(pages).filter(page => page?.deletedAt === null)[0]?.path}`);
    setIsMutating(false);
  }

  async function restorePage () {
    const page = pages[pageId];
    setIsMutating(true);
    await charmClient.restorePage(pageId);
    await mutate(`pages/${space?.id}`);
    router.push(`/${router.query.domain}/${page?.path}`);
    dispatch(initialLoad());
    setIsMutating(false);
  }

  return (
    <StyledPageDeleteBanner>
      <Box display='flex' gap={1} alignItems='center'>
        This page is in Trash
        <Button color={'white' as any} disabled={isMutating} onClick={restorePage} variant='outlined'>Restore Page</Button>
        <Button color={'white' as any} disabled={isMutating} onClick={deletePage} variant='outlined'>Delete permanently</Button>
      </Box>
    </StyledPageDeleteBanner>
  );
}
