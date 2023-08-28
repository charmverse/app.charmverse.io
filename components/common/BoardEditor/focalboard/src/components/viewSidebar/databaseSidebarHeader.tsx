import BackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, Typography } from '@mui/material';

export function DatabaseSidebarHeader({
  onClose,
  goBack,
  title
}: {
  onClose?: () => void;
  goBack?: () => void;
  title?: string;
}) {
  return (
    <Box px={2} pt={1} pb={1} display='flex' justifyContent='space-between' alignItems='center'>
      <Box display='flex' alignItems='center' gap={1}>
        {goBack && (
          <IconButton size='small' onClick={goBack}>
            <BackIcon fontSize='small' color='secondary' />
          </IconButton>
        )}
        {title && (
          <Typography fontWeight='bold' variant='body2'>
            {title}
          </Typography>
        )}
      </Box>
      {onClose && (
        <IconButton onClick={onClose} size='small'>
          <CloseIcon fontSize='small' />
        </IconButton>
      )}
    </Box>
  );
}
