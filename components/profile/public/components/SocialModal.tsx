import styled from '@emotion/styled';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, Grid, SvgIcon, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import { Modal, DialogTitle } from 'components/common/Modal';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import DiscordIcon from 'public/images/discord_logo.svg';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import log from 'lib/log';

const StyledButton = styled(Button)`
    border-radius: 7px;
`;

export const schema = yup.object({
  twitter: yup.string().ensure().trim()
    .matches(/^http(?:s)?:\/\/(?:www\.)?twitter\.com\/([a-zA-Z0-9_]+)/i, 'Invalid Twitter link')
    .nullable(true),
  github: yup.string().ensure().trim()
    .matches(/^http(?:s)?:\/\/(?:www\.)?github\.([a-z])+\/([A-Za-z0-9]{1,})+\/?$/i, 'Invalid GitHub link')
    .nullable(true),
  discord: yup.string().ensure()
    .nullable(true),
  linkedin: yup.string().ensure()
    .matches(/^(http(s)?:\/\/)?([\w]+\.)?linkedin\.com\/(pub|in|profile)$/i, 'Invalid LinkedIn link')
    .nullable(true)
});

export type FormValues = yup.InferType<typeof schema>;

type SocialModalProps = {
    defaultValues: { twitter: string, github: string, discord: string, linkedin: string },
    close: () => void,
    isOpen: boolean,
};

function SocialModal (props: SocialModalProps) {
  const { defaultValues, close, isOpen } = props;
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema)
  });

  function onSubmit (values: FormValues) {
    try {
    }
    catch (err) {
      log.error('Error updating social media links', err);
    }
  }

  return (

    <Modal open={isOpen} onClose={() => {}} size='large'>
      <DialogTitle onClose={close}>Social media links</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item container direction={{ xs: 'column', md: 'row' }} alignItems='center'>
            <Grid item container direction='row' xs={12} md={3}>
              <TwitterIcon style={{ color: '#00ACEE', height: '22px' }} />
              <Typography ml={1}>Twitter:</Typography>
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField
                {...register('twitter')}
                fullWidth
                error={!!errors.twitter}
                helperText={errors.twitter?.message}
                placeholder='https://mobile.twitter.com/charmverse'
              />
            </Grid>
          </Grid>
          <Grid item container direction={{ xs: 'column', md: 'row' }} alignItems='center'>
            <Grid item container direction='row' xs={12} md={3}>
              <GitHubIcon style={{ color: '#000000', height: '22px' }} />
              <Typography ml={1}>GitHub:</Typography>
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField
                {...register('github')}
                fullWidth
                error={!!errors.github}
                helperText={errors.github?.message}
                placeholder='https://github.com/charmverse'
              />
            </Grid>
          </Grid>
          <Grid item container direction={{ xs: 'column', md: 'row' }} alignItems='center'>
            <Grid item container direction='row' xs={12} md={3}>
              <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#000000', height: '22px' }}>
                <DiscordIcon />
              </SvgIcon>
              <Typography ml={1}>Discord:</Typography>
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField
                {...register('discord')}
                fullWidth
                error={!!errors.discord}
                helperText={errors.discord?.message}
                placeholder='CharmVerse'
              />
            </Grid>
          </Grid>
          <Grid item container direction={{ xs: 'column', md: 'row' }} alignItems='center'>
            <Grid item container direction='row' xs={12} md={3}>
              <LinkedInIcon style={{ color: '#0072B1', height: '22px' }} />
              <Typography ml={1}>LinkedIn:</Typography>
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField
                {...register('linkedin')}
                fullWidth
                error={!!errors.linkedin}
                helperText={errors.linkedin?.message}
                placeholder='https://www.linkedin.com/in/alexchibunpoon/'
              />
            </Grid>
          </Grid>
        </Grid>
        <Box justifyContent='end' mt={3} sx={{ display: 'flex' }}>
          <StyledButton
            onClick={() => {
            }}
          >
            Save
          </StyledButton>
        </Box>
      </form>
    </Modal>
  );
}

export default SocialModal;
