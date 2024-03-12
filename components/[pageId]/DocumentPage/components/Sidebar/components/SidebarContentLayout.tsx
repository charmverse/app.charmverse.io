import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material/Box';

export function SidebarContentLayout(props: BoxProps) {
  return <Box display='flex' height='100%' flexDirection='column' gap={1} {...props} />;
}

export function SidebarHeader(props: BoxProps) {
  return <Box display='flex' alignItems='center' gap={1} px={1} {...props} />;
}
