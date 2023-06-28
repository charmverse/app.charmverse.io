import { Card, CardContent, CardHeader, Divider, Typography } from '@mui/material';

export function ProfileWidget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        sx={{
          pb: 0
        }}
        title={
          <Typography variant='h6' fontWeight={700}>
            {title}
          </Typography>
        }
      />
      <CardContent
        sx={{
          pt: 1
        }}
      >
        <Divider
          sx={{
            mb: 1
          }}
        />
        {children}
      </CardContent>
    </Card>
  );
}
