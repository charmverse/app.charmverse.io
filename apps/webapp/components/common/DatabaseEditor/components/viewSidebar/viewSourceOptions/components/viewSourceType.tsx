import { Box, Typography, Card, Grid, Tooltip } from '@mui/material';
import type { GridProps } from '@mui/material/Grid';

export function SourceType<C extends React.ElementType>({
  active,
  children,
  disabled,
  disabledTooltip,
  ...restProps
}: GridProps<
  C,
  { component?: C } & {
    active?: boolean;
  }
>) {
  return (
    <Grid item xs={6} {...restProps} onClick={disabled ? undefined : restProps.onClick}>
      <Tooltip title={disabled ? disabledTooltip : ''}>
        <Card
          variant='outlined'
          sx={{
            height: '80px',
            userSelect: disabled ? 'none' : 'auto',
            cursor: disabled ? undefined : 'pointer',
            borderColor: active ? 'var(--primary-color)' : '',
            opacity: (theme) => (disabled ? theme.palette.action.disabledOpacity : ''),
            bgcolor: (theme) => (disabled ? theme.palette.action.disabledBackground : ''),
            '&:hover': { bgcolor: disabled ? undefined : !active ? 'sidebar.background' : '' }
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
      </Tooltip>
    </Grid>
  );
}
