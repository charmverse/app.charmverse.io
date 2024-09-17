import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { IconButtonProps } from '@mui/material';
import { IconButton } from '@mui/material';
import type { CustomArrowProps } from 'react-slick';

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

export function NextArrow({ className, style, currentSlide, slideCount, ...props }: CustomArrowProps) {
  return (
    <IconButton
      {...props}
      sx={{ ...defaultSx, height: '200px', right: '-40px' }}
      aria-hidden='true'
      aria-disabled={currentSlide === 0}
    >
      <ChevronRightIcon color='secondary' />
    </IconButton>
  );
}

export function PrevArrow({ className, style, currentSlide, slideCount, ...props }: CustomArrowProps) {
  return (
    <IconButton
      {...props}
      sx={{ ...defaultSx, height: '200px', left: '-40px' }}
      aria-hidden='true'
      aria-disabled={currentSlide === 0}
    >
      <ChevronLeftIcon color='secondary' />
    </IconButton>
  );
}
