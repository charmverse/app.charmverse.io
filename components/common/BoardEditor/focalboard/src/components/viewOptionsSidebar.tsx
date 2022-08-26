import { Box, Collapse, Divider, IconButton, ListItemIcon, MenuItem, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import styled from '@emotion/styled';

interface Props {
  closeSidebar: () => void;
  isOpen: boolean;
}

const StyledSidebar = styled.div`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-left: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
  display: flex;
  flex-direction: column;
  height: 300px;
  min-height: 100%;
  width: 100%;
  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 250px;
  }
`;

export default function ViewOptionsSidebar (props: Props) {

  return (
    <>
      <Collapse in={props.isOpen} orientation='horizontal' sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 1000 }}>
        <StyledSidebar>
          <Box px={2} pt={1} pb={1} display='flex' justifyContent='space-between' alignItems='center'>
            <Typography fontWeight='bold'>View options</Typography>
            <IconButton onClick={props.closeSidebar} size='small'>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Box>
            <MenuItem>
              <ListItemIcon><AddIcon color='secondary' /></ListItemIcon>
              <Typography variant='body2' color='secondary'>
                Layout
              </Typography>
            </MenuItem>
        </StyledSidebar>
      </Collapse>
    </>
  );
}
