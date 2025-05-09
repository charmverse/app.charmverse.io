import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { PropsWithChildren, ReactNode } from 'react';

type Props = {
  title: string | ReactNode;
  titleRightElement?: ReactNode;
};

export default function Section({ title, titleRightElement, children, ...rest }: PropsWithChildren<Props>) {
  return (
    <Box padding={5} {...rest}>
      <Box padding={2}>
        <Typography fontSize={{ base: 'md', sm: 'lg' }} component='h3'>
          {title}
        </Typography>
        {titleRightElement}
      </Box>

      {children}
    </Box>
  );
}
