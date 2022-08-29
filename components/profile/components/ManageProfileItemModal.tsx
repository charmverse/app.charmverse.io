import styled from '@emotion/styled';
import ClearIcon from '@mui/icons-material/Clear';
import { Box, Grid, Link, Stack, Tab, Tabs, Typography } from '@mui/material';
import { Prisma, ProfileItem } from '@prisma/client';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { DialogTitle, Modal } from 'components/common/Modal';
import { NftData } from 'lib/nft/interfaces';
import { ExtendedPoap } from 'models';
import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';

type ManageProfileItemModalProps = {
    visiblePoaps: ExtendedPoap[];
    hiddenPoaps: ExtendedPoap[];
    hiddenNfts: NftData[];
    visibleNfts: NftData[];
    save: () => void,
    close: () => void,
    isOpen: boolean,
};

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

function ProfileItemsTab ({ profileItems, onClick, tab }: { tab: 'visible' | 'hidden', onClick: (profileItemId: string) => void, profileItems: Pick<ProfileItem, 'id' | 'metadata' | 'type'>[]}) {
  return (
    <Grid item container xs={12} py={2}>
      { profileItems.map((profileItem) => (
        <StyledGridItem item xs={4} md={3} p={1} key={profileItem.id}>
          <StyledStack direction='row' spacing={2} p={0.5} className='icons-stack'>
            { tab === 'visible' ? (
              <ClearIcon
                onClick={() => onClick(profileItem.id)}
                fontSize='small'
              />
            ) : (
              <AddIcon
                onClick={() => onClick(profileItem.id)}
                fontSize='small'
              />
            )}
          </StyledStack>
          {
            profileItem.type === 'nft' ? (
              <img
                style={{
                  clipPath: 'url(#hexagon-avatar)',
                  width: '100%'
                }}
                src={(profileItem.metadata as Prisma.JsonObject)?.imageURL as string}
              />
            ) : (
              <Link href={`https://app.poap.xyz/token/${profileItem.id}`} target='_blank' display='flex'>
                <StyledImage
                  src={(profileItem.metadata as Prisma.JsonObject)?.imageURL as string}
                />
              </Link>
            )
          }
        </StyledGridItem>
      ))}
    </Grid>
  );
}

function ManageProfileItemModal (props: ManageProfileItemModalProps) {
  const { visiblePoaps, hiddenPoaps, hiddenNfts, visibleNfts, close, isOpen, save } = props;
  const [tabIndex, setTabIndex] = useState(0);
  const [hiddenProfileItemIds, setHiddenProfileItemIds] = useState<string[]>([]);
  const [shownProfileItemIds, setShownProfileItemIds] = useState<string[]>([]);

  const existingVisibleProfileItemIds: string[] = [...visiblePoaps.map(poap => poap.tokenId), ...visibleNfts.map(nft => nft.tokenId)];
  const existingHiddenProfileItemIds: string[] = [...hiddenPoaps.map(poap => poap.tokenId), ...hiddenNfts.map(nft => nft.tokenId)];

  useEffect(() => {
    setHiddenProfileItemIds([...hiddenPoaps.map(poap => (poap.tokenId)), ...hiddenNfts.map(nft => nft.tokenId)]);
    setShownProfileItemIds([...visiblePoaps.map(poap => (poap.tokenId)), ...visibleNfts.map(nft => nft.tokenId)]);
  }, [hiddenPoaps, visiblePoaps, visibleNfts, hiddenNfts]);

  const profileItemsRecord: Record<string, Pick<ProfileItem, 'id' | 'metadata' | 'type'>> = {};

  [...visiblePoaps, ...hiddenPoaps].forEach(poap => {
    profileItemsRecord[poap.tokenId] = {
      id: poap.tokenId,
      metadata: {
        imageURL: poap.imageURL,
        name: poap.name,
        created: poap.created,
        walletAddress: poap.walletAddress
      },
      type: 'poap'
    };
  });

  [...visibleNfts, ...hiddenNfts].forEach(nft => {
    profileItemsRecord[nft.tokenId] = {
      id: nft.tokenId,
      metadata: {
        imageURL: nft.image ?? nft.imageThumb,
        title: nft.title,
        date: nft.timeLastUpdated
      },
      type: 'nft'
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
    await charmClient.profile.updateProfileItem({
      hiddenProfileItems: hiddenProfileItemIds.filter(profileItemId => !existingHiddenProfileItemIds.includes(profileItemId))
        .map(hiddenProfileItemId => profileItemsRecord[hiddenProfileItemId]),
      shownProfileItems: shownProfileItemIds.filter(profileItemId => !existingVisibleProfileItemIds.includes(profileItemId))
        .map(shownProfileItemId => profileItemsRecord[shownProfileItemId])
    });
    setTabIndex(0);
    save();
  };

  const shownProfileItems = shownProfileItemIds.map(profileItemId => profileItemsRecord[profileItemId]);
  const hiddenProfileItems = hiddenProfileItemIds.map(profileItemId => profileItemsRecord[profileItemId]);

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
      <Box hidden={tabIndex !== 0} py={2}>
        {
          shownProfileItems.length !== 0 ? (
            <ProfileItemsTab
              tab='visible'
              profileItems={shownProfileItems}
              onClick={(profileItemId) => {
                handleHideProfileItem(profileItemId);
              }}
            />
          ) : (
            <Grid item container xs={12} justifyContent='center' py={2}>
              <Typography>There are no visible NFTs or POAPs</Typography>
            </Grid>
          )
        }
      </Box>
      <Box hidden={tabIndex !== 1} py={2}>
        {
          hiddenProfileItems.length !== 0 ? (
            <ProfileItemsTab
              tab='hidden'
              profileItems={hiddenProfileItems}
              onClick={(profileItemId) => {
                handleShowProfileItem(profileItemId);
              }}
            />
          ) : (
            <Grid item container xs={12} justifyContent='center' py={2}>
              <Typography>There are no hidden NFTs or POAPs</Typography>
            </Grid>
          )
        }
      </Box>
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
