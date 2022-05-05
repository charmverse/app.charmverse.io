import styled from '@emotion/styled';
import { Box, Button } from '@mui/material';
import { usePages } from 'hooks/usePages';
import { useState } from 'react';

const StyledPageDeleteBanner = styled(Box)<{card?: boolean}>`
  position: fixed;
  top: ${({ card }) => card ? '50px' : '55px'};
  width: ${({ card }) => card ? '100%' : 'calc(100% - 300px)'};
  z-index: var(--z-index-appBar);
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.palette.error.main};
  padding: ${({ theme }) => theme.spacing(1)};
`;

export default function PageDeleteBanner ({ pageId }: {pageId: string}) {
  const [isMutating, setIsMutating] = useState(false);
  const { restorePage, deletePage } = usePages();

  const isShowingCard = new URLSearchParams(window.location.search).get('cardId');

  return (
    <StyledPageDeleteBanner card={isShowingCard ? (isShowingCard !== 'undefined' && isShowingCard.length !== 0) : false}>
      <Box display='flex' gap={1} alignItems='center'>
        <div style={{
          color: 'white',
          fontWeight: 600
        }}
        >This page is in Trash
        </div>
        <Button
          color={'white' as any}
          disabled={isMutating}
          onClick={async () => {
            setIsMutating(true);
            await restorePage(pageId, true);
            setIsMutating(false);
          }}
          variant='outlined'
        >Restore Page
        </Button>
        <Button
          color={'white' as any}
          disabled={isMutating}
          onClick={async () => {
            setIsMutating(true);
            await deletePage(pageId);
            setIsMutating(false);
          }}
          variant='outlined'
        >Delete permanently
        </Button>
      </Box>
    </StyledPageDeleteBanner>
  );
}
