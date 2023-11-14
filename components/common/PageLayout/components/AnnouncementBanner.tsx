import CloseIcon from '@mui/icons-material/Close';
import EastIcon from '@mui/icons-material/East';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { type ReactNode, useMemo } from 'react';
import { toHex } from 'viem';

import { StyledBanner } from 'components/common/Banners/Banner';
import { Button } from 'components/common/Button';
import { useLocalStorage } from 'hooks/useLocalStorage';

export function AnnouncementBanner({
  children,
  forceShow,
  errorBackground,
  actionLabel,
  actionHref,
  onActionClick,
  spaceId,
  bannerId,
  expiryDate
}: {
  forceShow?: boolean;
  errorBackground?: boolean;
  children: string | ReactNode;
  actionLabel: string;
  actionHref?: string;
  spaceId?: string;
  bannerId?: string;
  onActionClick?: () => void;
  expiryDate?: string;
}) {
  const id = useMemo(() => toHex(`${bannerId || children?.toString() || ''}/${spaceId || ''}`), [children]);

  const [showAnnouncement, setShowAnnouncement] = useLocalStorage(id, true);

  const isExpired = expiryDate && new Date(expiryDate) < new Date();

  if ((!showAnnouncement && !forceShow) || isExpired) {
    return null;
  }

  return (
    <StyledBanner errorBackground={errorBackground} top={20}>
      <Box pr={3} display='flex' alignItems='center'>
        {typeof children === 'string' ? <Typography>{children}</Typography> : children}
        {actionLabel && (actionHref || onActionClick) && (
          <Stack gap={0.5} flexDirection='row' alignItems='center' display='inline-flex'>
            <Button
              endIcon={<EastIcon />}
              sx={{ ml: 1, pb: 0, pt: 0, fontWeight: 600 }}
              color={errorBackground ? 'white' : 'primary'}
              href={actionHref}
              onClick={onActionClick}
              variant='outlined'
              external
              target='_blank'
            >
              {actionLabel}
            </Button>
          </Stack>
        )}
      </Box>
      {!forceShow && (
        <IconButton
          onClick={() => setShowAnnouncement(false)}
          size='small'
          sx={{
            position: 'absolute',
            right: 5,
            top: 8
          }}
        >
          <CloseIcon fontSize='small' />
        </IconButton>
      )}
    </StyledBanner>
  );
}
