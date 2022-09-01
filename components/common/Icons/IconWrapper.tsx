import Typography from '@mui/material/Typography';

interface Props {
  children: React.ReactNode
}

export function IconWrapper ({ children }: Props) {
  return (
    <Typography display='inline-flex' sx={{ verticalAlign: 'middle' }} gap={1}>
      {children}
    </Typography>
  );
}
