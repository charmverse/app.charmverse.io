import { Box, Button, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import { useAddToHomescreenPrompt } from 'hooks/useAddToHomeScreenPrompt';

export function InstallAppMenuItem({ children }: { children: ReactNode }) {
  const { prompt, promptToInstall, isPwaInstalled } = useAddToHomescreenPrompt();

  if (!prompt || isPwaInstalled) {
    return null;
  }

  return (
    <Box bgcolor='background.dark' p={2}>
      <Typography color='white' variant='body2' mb={1}>
        Enjoy the full experience with our free webapp
      </Typography>
      <Button onClick={promptToInstall}>{children}</Button>
    </Box>
  );
}
