import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import charmClient from 'charmClient';
import { Modal, DialogTitle } from 'components/common/Modal';
import Button from 'components/common/Button';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import { UpdatePoapsRequest } from 'lib/poap';
import { Box, Grid, Link, Stack, Tab, Tabs, Typography } from '@mui/material';
import { ExtendedPoap } from 'models';

type ManagePOAPModalProps = {
    visiblePoaps: Array<Partial<ExtendedPoap>>;
    hiddenPoaps: Array<Partial<ExtendedPoap>>;
    save: () => void,
    close: () => void,
    isOpen: boolean,
};

const TabPanel = styled(Box)`
  width: 100%;
`;

const StyledImage = styled.img`
  width: 100%;
  border-radius: 50%;
`;

const StyledGridItem = styled(Grid)`
    position: relative;

    .icons-stack {
      display: flex;
      border-radius: 50%;
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      .icons-stack {
        display: none;
     }
     &:hover .icons-stack {
       display: flex;
     }
    }
`;

const StyledStack = styled(Stack)`
    position: absolute;
    top: 10px;
    right: 20px;
    z-index: 1000;
    background-color: black;
    opacity: 80%;
    border-radius: 10%;
    display: none;

    & > svg {
      color: white;
      cursor: pointer;
    }
`;

function ManagePOAPModal (props: ManagePOAPModalProps) {
  const { visiblePoaps, hiddenPoaps, close, isOpen, save } = props;
  const [tabIndex, setTabIndex] = useState(0);
  const [newHiddenPoaps, setNewHiddenPoaps] = useState<Array<Partial<ExtendedPoap>>>([]);
  const [newShownPoaps, setNewShownPoaps] = useState<Array<Partial<ExtendedPoap>>>([]);
  const [displayedHiddenPoaps, setDisplayedHiddenPoaps] = useState<Array<Partial<ExtendedPoap>>>([]);
  const [displayedShownPoaps, setDisplayedShownPoaps] = useState<Array<Partial<ExtendedPoap>>>([]);

  useEffect(() => {
    setDisplayedHiddenPoaps([
      ...hiddenPoaps.filter((poap: Partial<ExtendedPoap>) => !newShownPoaps.some(p => p.tokenId === poap.tokenId)),
      ...newHiddenPoaps
    ]);
    setDisplayedShownPoaps([
      ...visiblePoaps.filter((poap: Partial<ExtendedPoap>) => !newHiddenPoaps.some(p => p.tokenId === poap.tokenId)),
      ...newShownPoaps
    ]);
  }, [visiblePoaps, hiddenPoaps, newHiddenPoaps, newShownPoaps]);

  const handleHidePoap = (poap: Partial<ExtendedPoap>) => {
    if (newShownPoaps.some((p: Partial<ExtendedPoap>) => p.tokenId === poap.tokenId)) {
      setNewShownPoaps([
        ...newShownPoaps.filter((p: Partial<ExtendedPoap>) => p.tokenId !== poap.tokenId)
      ]);
      return;
    }

    setNewHiddenPoaps([
      ...newHiddenPoaps,
      poap
    ]);
  };

  const handleShowPoap = (poap: Partial<ExtendedPoap>) => {
    if (newHiddenPoaps.some((p: Partial<ExtendedPoap>) => p.tokenId === poap.tokenId)) {
      setNewHiddenPoaps([
        ...newHiddenPoaps.filter((p: Partial<ExtendedPoap>) => p.tokenId !== poap.tokenId)
      ]);
      return;
    }

    setNewShownPoaps([
      ...newShownPoaps,
      poap
    ]);
  };

  const handleSave = async () => {
    await charmClient.updateUserPoaps({
      newShownPoaps,
      newHiddenPoaps
    } as UpdatePoapsRequest);

    setNewHiddenPoaps([]);
    setNewShownPoaps([]);
    setTabIndex(0);

    save();
  };

  return (
    <Modal
      open={isOpen}
      onClose={close}
      size='large'
    >
      <DialogTitle onClose={close}>Manage my NFT & POAP Collection</DialogTitle>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={(_event, value: number) => setTabIndex(value)} aria-label='poap tabs'>
          <Tab label='Visible' id='visible-tab' aria-controls='visible-tabpanel' />
          <Tab label='Hidden' id='hidden-tab' aria-controls='hidden-tabpanel' />
        </Tabs>
      </Box>
      <TabPanel hidden={tabIndex !== 0} py={2}>
        {
          displayedShownPoaps.length !== 0 && (
            <Grid item container xs={12} py={2}>
              { displayedShownPoaps.map((poap: Partial<ExtendedPoap>) => (
                <StyledGridItem item xs={6} md={4} p={1} key={poap.tokenId}>
                  <StyledStack direction='row' spacing={2} p={0.5} className='icons-stack'>
                    <ClearIcon
                      onClick={() => handleHidePoap(poap)}
                      fontSize='small'
                    />
                  </StyledStack>
                  <Link href={`https://app.poap.xyz/token/${poap.tokenId}`} target='_blank' display='flex'>
                    <StyledImage src={poap.imageURL} />
                  </Link>
                </StyledGridItem>
              ))}
            </Grid>
          )
        }

        {
          displayedShownPoaps.length === 0 && (
            <Grid item container xs={12} justifyContent='center' py={2}>
              <Typography>There are no visible NFTs or POAPs</Typography>
            </Grid>
          )
        }
      </TabPanel>
      <TabPanel hidden={tabIndex !== 1} py={2}>
        {
          displayedHiddenPoaps.length !== 0 && (
            <Grid item container xs={12} py={2}>
              { displayedHiddenPoaps.map((poap: Partial<ExtendedPoap>) => (
                <StyledGridItem item xs={6} md={4} p={1} key={poap.tokenId}>
                  <StyledStack direction='row' spacing={2} p={0.5} className='icons-stack'>
                    <AddIcon
                      onClick={() => handleShowPoap(poap)}
                      fontSize='small'
                    />
                  </StyledStack>
                  <Link href={`https://app.poap.xyz/token/${poap.tokenId}`} target='_blank' display='flex'>
                    <StyledImage src={poap.imageURL} />
                  </Link>
                </StyledGridItem>
              ))}
            </Grid>
          )
        }
        {
          displayedHiddenPoaps.length === 0 && (
            <Grid item container xs={12} justifyContent='center' py={2}>
              <Typography>There are no hidden NFTs or POAPs</Typography>
            </Grid>
          )
        }
      </TabPanel>
      <Box mt={4} sx={{ display: 'flex' }}>
        <Button
          onClick={() => handleSave()}
        >
          Save
        </Button>
      </Box>
    </Modal>
  );
}

export default ManagePOAPModal;
