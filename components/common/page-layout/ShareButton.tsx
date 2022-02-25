
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import LinkIcon from '@mui/icons-material/Link';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import styled from '@emotion/styled';
import { Page } from '@prisma/client';

export default function ShareButton ({ page }: { page: Page }) {

  const { isPublic } = page;

  async function togglePublic (newPublicStatus: boolean) {
    const updatedPage = await charmClient.togglePagePublicAccess(currentPage!.id, newPublicStatus);
    setIsPublic(updatedPage.isPublic);
  }

  return (
    <>
      <Button color='secondary' variant='text' size='small'>
        Share
      </Button>
      <Box>
        <Tooltip title={isPublic ? 'Make private' : 'Make public'} arrow placement='bottom'>
          <FormControlLabel
            control={(
              <Switch
                defaultChecked={isPublic}
                onChange={ev => togglePublic(ev.target.checked)}
                inputProps={{ 'aria-label': 'toggle public access' }}
              />
                )}
            label={isPublic === true ? 'Public' : 'Private'}
          />
        </Tooltip>
        {isPublic === true && (
        <Tooltip title='Copy sharing link' arrow placement='bottom'>

          <IconButton
            sx={{ ml: 1 }}
            color='inherit'
            onClick={generateShareLink}
          >
            {isPublic ? <LinkIcon color='secondary' /> : <LinkIcon color='secondary' />}
          </IconButton>

        </Tooltip>
        )}
      </Box>
    </>
  );
}
