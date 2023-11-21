import { yupResolver } from '@hookform/resolvers/yup';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import type { ChangeEvent } from 'react';
import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import FieldLabel from 'components/common/form/FieldLabel';
import type { Social } from 'lib/members/interfaces';
import debounce from 'lib/utilities/debounce';

export const schema = yup.object({
  twitterURL: yup
    .string()
    .notRequired()
    .ensure()
    .trim()
    .matches(/^$|^http(?:s)?:\/\/(?:www\.)?(?:mobile\.)?twitter\.com\/([a-zA-Z0-9_]+)/i, 'Invalid X link'),
  githubURL: yup
    .string()
    .notRequired()
    .ensure()
    .trim()
    .matches(/^$|^http(?:s)?:\/\/(?:www\.)?github\.([a-z])+\/([^\s\\]{1,})+\/?$/i, 'Invalid GitHub link'),
  discordUsername: yup.string().notRequired().ensure().trim(),
  linkedinURL: yup
    .string()
    .notRequired()
    .ensure()
    .matches(
      /^$|^http(?:s)?:\/\/((www|\w\w)\.)?linkedin.com\/((in\/[^/]+\/?)|(company\/[^/]+\/?)|(pub\/[^/]+\/((\w|\d)+\/?){3}))$/i,
      'Invalid LinkedIn link'
    )
});

export type FormValues = yup.InferType<typeof schema>;

type SocialInputsProps = {
  social?: Social;
  save: (social: Social) => Promise<void>;
  readOnly?: boolean;
};

const initialSocials: Social = {
  twitterURL: '',
  githubURL: '',
  discordUsername: '',
  linkedinURL: ''
};

export function SocialInputs(props: SocialInputsProps) {
  const { social = initialSocials, save, readOnly } = props;

  const {
    register,
    trigger,
    reset,
    setValue,
    formState: { errors },
    getValues
  } = useForm<FormValues>({
    defaultValues: social,
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  const values = getValues();

  const onChange = useCallback(
    debounce(async (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!readOnly) {
        setValue(event.target.name as keyof Social, event.target.value);
        const validation = await trigger();

        if (validation) {
          await save({
            ...values,
            [event.target.name]: event.target.value ?? ''
          });
        }
      }
    }, 300),
    [readOnly, values]
  );

  useEffect(() => {
    reset(social);
  }, [social]);

  return (
    <>
      <Grid item>
        <FieldLabel>X</FieldLabel>
        <TextField
          {...register('twitterURL')}
          fullWidth
          disabled={readOnly}
          error={!!errors.twitterURL}
          helperText={errors.twitterURL?.message}
          placeholder='https://twitter.com/charmverse'
          onChange={onChange}
        />
      </Grid>
      <Grid item>
        <FieldLabel>GitHub</FieldLabel>
        <TextField
          {...register('githubURL')}
          disabled={readOnly}
          fullWidth
          error={!!errors.githubURL}
          helperText={errors.githubURL?.message}
          placeholder='https://github.com/charmverse'
          onChange={onChange}
        />
      </Grid>
      <Grid item>
        <FieldLabel>Discord</FieldLabel>
        <TextField
          {...register('discordUsername')}
          disabled={readOnly}
          fullWidth
          error={!!errors.discordUsername}
          helperText={errors.discordUsername?.message}
          placeholder='Username#1234'
          onChange={onChange}
        />
      </Grid>
      <Grid item>
        <FieldLabel>LinkedIn</FieldLabel>
        <TextField
          {...register('linkedinURL')}
          disabled={readOnly}
          fullWidth
          error={!!errors.linkedinURL}
          helperText={errors.linkedinURL?.message}
          placeholder='https://www.linkedin.com/in/alexchibunpoon/'
          onChange={onChange}
        />
      </Grid>
    </>
  );
}
