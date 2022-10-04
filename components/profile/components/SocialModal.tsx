import { yupResolver } from '@hookform/resolvers/yup';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Box, Grid, SvgIcon, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import Button from 'components/common/Button';
import { DialogTitle, Modal } from 'components/common/Modal';
import DiscordIcon from 'public/images/discord_logo.svg';

import type { Social } from '../interfaces';

export const schema = yup.object({
  twitterURL: yup.string().notRequired().ensure().trim()
    .matches(/^$|^http(?:s)?:\/\/(?:www\.)?(?:mobile\.)?twitter\.com\/([a-zA-Z0-9_]+)/i, 'Invalid Twitter link'),
  githubURL: yup.string().notRequired().ensure().trim()
    .matches(/^$|^http(?:s)?:\/\/(?:www\.)?github\.([a-z])+\/([A-Za-z0-9]{1,})+\/?$/i, 'Invalid GitHub link'),
  discordUsername: yup.string().notRequired().ensure().trim()
    .matches(/^$|^((?!(discordtag|everyone|here)#)((?!@|#|:|```).{2,32})#\d{4})/, 'Invalid Discord username'),
  linkedinURL: yup.string().notRequired().ensure()
    .matches(/^$|^http(?:s)?:\/\/((www|\w\w)\.)?linkedin.com\/((in\/[^/]+\/?)|(company\/[^/]+\/?)|(pub\/[^/]+\/((\w|\d)+\/?){3}))$/i, 'Invalid LinkedIn link')
});

export type FormValues = yup.InferType<typeof schema>;

type SocialModalProps = {
    social: Social;
    save: (social: Social) => void;
    close: () => void;
    isOpen: boolean;
};

function SocialModal (props: SocialModalProps) {
  const { social, save, close, isOpen } = props;
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: social,
    resolver: yupResolver(schema)
  });

  function onSubmit (values: FormValues) {
    save(values as Social);
  }

  useEffect(() => {
    reset(social);
  }, [social]);

  return (

    <Modal
      open={isOpen}
      onClose={close}
      size='large'
    >
      <DialogTitle onClose={close}>Social media links</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4}>
          <Grid item container direction='row' alignItems='center'>
            <Grid item container direction='row' xs={12} md={3}>
              <TwitterIcon style={{ color: '#00ACEE', height: '22px' }} />
              <Typography ml={1}>Twitter:</Typography>
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField
                {...register('twitterURL')}
                fullWidth
                error={!!errors.twitterURL}
                helperText={errors.twitterURL?.message}
                placeholder='https://mobile.twitter.com/charmverse'
              />
            </Grid>
          </Grid>
          <Grid item container direction='row' alignItems='center'>
            <Grid item container direction='row' xs={12} md={3}>
              <GitHubIcon style={{ color: '#888', height: '22px' }} />
              <Typography ml={1}>GitHub:</Typography>
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField
                {...register('githubURL')}
                fullWidth
                error={!!errors.githubURL}
                helperText={errors.githubURL?.message}
                placeholder='https://github.com/charmverse'
              />
            </Grid>
          </Grid>
          <Grid item container direction='row' alignItems='center'>
            <Grid item container direction='row' xs={12} md={3}>
              <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#5865F2', height: '22px' }}>
                <DiscordIcon />
              </SvgIcon>
              <Typography ml={1}>Discord:</Typography>
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField
                {...register('discordUsername')}
                fullWidth
                error={!!errors.discordUsername}
                helperText={errors.discordUsername?.message}
                placeholder='Username#1234'
              />
            </Grid>
          </Grid>
          <Grid item container direction='row' alignItems='center'>
            <Grid item container direction='row' xs={12} md={3}>
              <LinkedInIcon style={{ color: '#0072B1', height: '22px' }} />
              <Typography ml={1}>LinkedIn:</Typography>
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField
                {...register('linkedinURL')}
                fullWidth
                error={!!errors.linkedinURL}
                helperText={errors.linkedinURL?.message}
                placeholder='https://www.linkedin.com/in/alexchibunpoon/'
              />
            </Grid>
          </Grid>
        </Grid>
        <Box mt={4} sx={{ display: 'flex' }}>
          <Button
            type='submit'
          >
            Save
          </Button>
        </Box>
      </form>
    </Modal>
  );
}

export default SocialModal;
