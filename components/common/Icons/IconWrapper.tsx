import Typography from '@mui/material/Typography';

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
}

export function IconWrapper({ children, onClick = () => null }: Props) {
  return (
    <Typography onClick={onClick} display='inline-flex' sx={{ verticalAlign: 'middle' }} gap={1}>
      {children}
    </Typography>
  );
}
