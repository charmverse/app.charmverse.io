import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { IconButtonProps } from '@mui/material';
import { IconButton } from '@mui/material';

const defaultSx: IconButtonProps['sx'] = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  top: '50%',
  width: '30px',
  background: '#202020',
  transform: 'translate(0, -50%)',
  borderRadius: '5px',
  '&:hover': {
    background: '#202020'
  }
};

export function NextArrow(props: IconButtonProps) {
  return (
    <IconButton {...props} sx={{ ...defaultSx, height: '200px', right: '-10px' }}>
      <ChevronRightIcon color='secondary' />
    </IconButton>
  );
}

export function PrevArrow(props: IconButtonProps) {
  return (
    <IconButton {...props} sx={{ ...defaultSx, height: '200px', left: '-10px' }}>
      <ChevronLeftIcon color='secondary' />
    </IconButton>
  );
}
