import { useState } from 'react';
import styled from '@emotion/styled';
import { Modal, DialogTitle } from 'components/common/Modal';
import Button from 'components/common/Button';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import { Box, Grid, Link, Stack, Tab, Tabs, Typography } from '@mui/material';
import { ExtendedPoap } from 'models';

type ManagePOAPModalProps = {
    visiblePoaps: Array<Partial<ExtendedPoap>>;
    hiddenPoaps: Array<Partial<ExtendedPoap>>;
    save: (description: string) => void,
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

    &:hover .icons-stack {
      display: flex;
      border-radius: 50%;
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

  return (
    <Modal
      open={isOpen}
      onClose={close}
      sx={{
        '>.modal-container': {
          maxWidth: '670px',
          width: '100%'
        }
      }}
    >
      <DialogTitle onClose={close}>Manage my POAP Collection</DialogTitle>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={(_event, value: number) => setTabIndex(value)} aria-label='basic tabs example'>
          <Tab label='Visible' id='visible-tab' aria-controls='visible-tabpanel' />
          <Tab label='Hidden' id='hidden-tab' aria-controls='hidden-tabpanel' />
        </Tabs>
      </Box>
      <TabPanel hidden={tabIndex !== 0} py={2}>

        {
            visiblePoaps && visiblePoaps.length !== 0 && (
            <Grid item container xs={12} py={2}>
              { visiblePoaps.map((poap: Partial<ExtendedPoap>) => (
                <StyledGridItem item xs={6} md={4} p={1} key={poap.tokenId}>
                  <StyledStack direction='row' spacing={2} p={0.5} className='icons-stack'>
                    <ClearIcon
                      onClick={() => {}}
                      fontSize='small'
                      key='hide-poap'
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
          visiblePoaps && visiblePoaps.length === 0 && (
          <Grid item container xs={12} justifyContent='center' py={2}>
            <Typography>There are no visible POAPs</Typography>
          </Grid>
          )
        }
      </TabPanel>
      <TabPanel hidden={tabIndex !== 1} py={2}>
        {
            hiddenPoaps && hiddenPoaps.length !== 0 && (
            <Grid item container xs={12} py={2}>
              { hiddenPoaps.map((poap: Partial<ExtendedPoap>) => (
                <Grid item xs={6} md={4} p={1} key={poap.tokenId}>
                  <StyledStack direction='row' spacing={2} p={0.5} className='icons-stack'>
                    <AddIcon
                      onClick={() => {}}
                      fontSize='small'
                      key='show-poap'
                    />
                  </StyledStack>
                  <Link href={`https://app.poap.xyz/token/${poap.tokenId}`} target='_blank' display='flex'>
                    <StyledImage src={poap.imageURL} />
                  </Link>
                </Grid>
              ))}
            </Grid>
            )
        }
        {
          hiddenPoaps && hiddenPoaps.length === 0 && (
          <Grid item container xs={12} justifyContent='center' py={2}>
            <Typography>There are no hidden POAPs</Typography>
          </Grid>
          )
        }
      </TabPanel>
      <Box mt={4} sx={{ display: 'flex' }}>
        <Button
          type='submit'
        >
          Save
        </Button>
      </Box>
    </Modal>
  );
}

export default ManagePOAPModal;
