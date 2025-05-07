import { KeyboardArrowDown } from '@mui/icons-material';
import { FormLabel, IconButton, Stack, Typography } from '@mui/material';

type Props = {
  title: string;
  isExpanded: boolean;
  toggleExpanded: () => void;
};

export function ExpandableSectionTitle({ title, isExpanded, toggleExpanded }: Props) {
  return (
    <Stack direction='row' gap={1} alignItems='center' sx={{ cursor: 'pointer' }} onClick={toggleExpanded}>
      <Typography fontWeight='bold'>{title}</Typography>
      <IconButton size='small'>
        <KeyboardArrowDown
          fontSize='small'
          sx={{ transform: `rotate(${isExpanded ? 180 : 0}deg)`, transition: 'all 0.2s ease' }}
        />
      </IconButton>
    </Stack>
  );
}
