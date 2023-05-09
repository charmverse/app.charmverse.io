import type { GridProps } from '@mui/material';
import { Box, Typography, Card, Grid } from '@mui/material';

export function SourceType<C extends React.ElementType>({
  active,
  children,
  ...restProps
}: GridProps<
  C,
  { component?: C } & {
    active?: boolean;
  }
>) {
  return (
    <Grid item xs={6} {...restProps}>
      <Card
        variant='outlined'
        sx={{
          height: '80px',
          cursor: 'pointer',
          borderColor: active ? 'var(--primary-color)' : '',
          '&:hover': { bgcolor: !active ? 'sidebar.background' : '' }
        }}
      >
        <Typography align='center' height='100%' variant='body2' color={active ? 'primary' : 'secondary'}>
          <Box
            component='span'
            height='100%'
            display='flex'
            p={1}
            alignItems='center'
            flexDirection='column'
            justifyContent='center'
          >
            {children}
          </Box>
        </Typography>
      </Card>
    </Grid>
  );
}
