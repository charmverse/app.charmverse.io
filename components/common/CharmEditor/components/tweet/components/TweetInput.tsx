import TwitterIcon from '@mui/icons-material/Twitter';
import { Box, Button, ListItem, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import PopperPopup from 'components/common/PopperPopup';

interface TweetInputProps {
  autoOpen?: boolean;
  onSubmit: (url: string) => void;
  readOnly?: boolean;
  isValid?: (url: string) => boolean;
}

export function TweetInput(props: TweetInputProps) {
  const [embedUrl, setEmbedUrl] = useState('');
  const { onSubmit } = props;

  return (
    <PopperPopup
      autoOpen={props.autoOpen}
      popupContent={
        <Box width={750}>
          <Box
            display="flex"
            flexDirection="column"
            gap={2}
            py={2}
            alignItems="center"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'center'
            }}
          >
            <TextField
              autoFocus
              placeholder="https://twitter.com..."
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
            />
            <Button
              disabled={props.isValid ? !props.isValid(embedUrl) : !embedUrl}
              sx={{
                width: 250
              }}
              onClick={() => {
                onSubmit(embedUrl);
                setEmbedUrl('');
              }}
            >
              Embed Tweet
            </Button>
            <Typography color="secondary" variant="caption">
              Works with links to Tweets
            </Typography>
          </Box>
        </Box>
      }
    >
      <ListItem
        button
        disabled={props.readOnly}
        sx={{
          backgroundColor: 'background.light',
          p: 2,
          display: 'flex',
          borderRadius: 0.5,
          my: 0.5
        }}
      >
        <Typography color="secondary" display="flex" gap={1.5} width="100%" alignItems="center">
          <TwitterIcon fontSize="small" />
          <Typography>Embed a Tweet</Typography>
        </Typography>
      </ListItem>
    </PopperPopup>
  );
}
