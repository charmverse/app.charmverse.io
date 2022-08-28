import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import { Box, Grid, Link, Stack, Tab, Tabs, Typography } from '@mui/material';
import { Prisma, ProfileItem } from '@prisma/client';
import Button from 'components/common/Button';
import { DialogTitle, Modal } from 'components/common/Modal';
import { ExtendedPoap } from 'models';
import { useState } from 'react';

type ManageProfileItemModalProps = {
    visiblePoaps: ExtendedPoap[];
    hiddenPoaps: ExtendedPoap[];
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

function ManageProfileItemModal (props: ManageProfileItemModalProps) {
  const { visiblePoaps, hiddenPoaps, close, isOpen, save } = props;
  const [tabIndex, setTabIndex] = useState(0);
  const [hiddenProfileItemIds, setHiddenProfileItemIds] = useState<string[]>(hiddenPoaps.map(poap => (poap.tokenId)));
  const [shownProfileItemIds, setShownProfileItemIds] = useState<string[]>(visiblePoaps.map(poap => poap.tokenId));

  const profileItemsRecord: Record<string, Pick<ProfileItem, 'id' | 'metadata' | 'type'>> = {};

  [...visiblePoaps, ...hiddenPoaps].forEach(profileItem => {
    profileItemsRecord[profileItem.tokenId] = {
      id: profileItem.tokenId,
      metadata: {
        imageURL: profileItem.imageURL,
        name: profileItem.name
      },
      type: 'poap'
    };
  });

  const handleHideProfileItem = (profileItemId: string) => {
    setHiddenProfileItemIds([
      ...hiddenProfileItemIds,
      profileItemId
    ]);

    setShownProfileItemIds(shownProfileItemIds.filter(shownProfileItem => shownProfileItem !== profileItemId));
  };

  const handleShowProfileItem = (profileItemId: string) => {
    setShownProfileItemIds([
      ...shownProfileItemIds,
      profileItemId
    ]);

    setHiddenProfileItemIds(hiddenProfileItemIds.filter(hiddenProfileItem => hiddenProfileItem !== profileItemId));
  };

  const handleSave = async () => {
    // await charmClient.updateUserPoaps({
    //   newShownPoaps,
    //   newHiddenPoaps
    // } as UpdatePoapsRequest);

    setShownProfileItemIds([]);
    setHiddenProfileItemIds([]);
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
          shownProfileItemIds.length !== 0 && (
            <Grid item container xs={12} py={2}>
              { shownProfileItemIds.map((profileItemId) => (
                <StyledGridItem item xs={6} md={4} p={1} key={profileItemId}>
                  <StyledStack direction='row' spacing={2} p={0.5} className='icons-stack'>
                    <ClearIcon
                      onClick={() => handleHideProfileItem(profileItemId)}
                      fontSize='small'
                    />
                  </StyledStack>
                  <Link href={`https://app.poap.xyz/token/${profileItemId}`} target='_blank' display='flex'>
                    <StyledImage src={(profileItemsRecord[profileItemId].metadata as Prisma.JsonObject)?.imageURL as string} />
                  </Link>
                </StyledGridItem>
              ))}
            </Grid>
          )
        }

        {
          shownProfileItemIds.length === 0 && (
            <Grid item container xs={12} justifyContent='center' py={2}>
              <Typography>There are no visible NFTs or POAPs</Typography>
            </Grid>
          )
        }
      </TabPanel>
      <TabPanel hidden={tabIndex !== 1} py={2}>
        {
          hiddenProfileItemIds.length !== 0 && (
            <Grid item container xs={12} py={2}>
              { hiddenProfileItemIds.map((profileItemId) => (
                <StyledGridItem item xs={6} md={4} p={1} key={profileItemId}>
                  <StyledStack direction='row' spacing={2} p={0.5} className='icons-stack'>
                    <AddIcon
                      onClick={() => handleShowProfileItem(profileItemId)}
                      fontSize='small'
                    />
                  </StyledStack>
                  <Link href={`https://app.poap.xyz/token/${profileItemId}`} target='_blank' display='flex'>
                    <StyledImage src={(profileItemsRecord[profileItemId].metadata as Prisma.JsonObject)?.imageURL as string} />
                  </Link>
                </StyledGridItem>
              ))}
            </Grid>
          )
        }
        {
          hiddenProfileItemIds.length === 0 && (
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

export default ManageProfileItemModal;
