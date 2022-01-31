import styled from '@emotion/styled';

export const toolbarHeight = 56;

// @ts-ignore necessary for content to be below app bar
const AppBar = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2),
  '& .MuiIconButton-root': {
    opacity: 0,
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  '&:hover .MuiIconButton-root': {
    opacity: 1
  },
  // necessary for content to be below app bar
  minHeight: toolbarHeight
}));

export default AppBar;
