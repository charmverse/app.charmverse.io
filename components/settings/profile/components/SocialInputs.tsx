import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import type { FieldErrors } from 'react-hook-form';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { Social } from 'lib/members/interfaces';

type SocialInputsProps = {
  social?: Social;
  onChange: (social: Social) => void;
  readOnly?: boolean;
  errors?: FieldErrors<Record<keyof Social, string | null>>;
  required?: Record<keyof Social, boolean>;
};

const initialSocials: Social = {
  twitterURL: '',
  githubURL: '',
  discordUsername: '',
  linkedinURL: ''
};

export function SocialInputs(props: SocialInputsProps) {
  const social = props.social ?? initialSocials;
  const { required, errors, onChange, readOnly } = props;

  return (
    <>
      <FieldWrapper label='X' required={required?.twitterURL}>
        <TextField
          fullWidth
          value={social.twitterURL}
          disabled={readOnly}
          error={!!errors?.twitterURL?.message}
          helperText={errors?.twitterURL?.message}
          placeholder='https://x.com/charmverse'
          onChange={(event) => {
            onChange({
              ...social,
              twitterURL: event.target.value
            });
          }}
        />
      </FieldWrapper>
      <FieldWrapper label='Github' required={required?.githubURL}>
        <TextField
          value={social.githubURL}
          disabled={readOnly}
          fullWidth
          error={!!errors?.githubURL?.message}
          helperText={errors?.githubURL?.message}
          placeholder='https://github.com/charmverse'
          onChange={(event) => {
            onChange({
              ...social,
              githubURL: event.target.value
            });
          }}
        />
      </FieldWrapper>
      <FieldWrapper label='LinkedIn' required={required?.linkedinURL}>
        <TextField
          value={social.linkedinURL}
          disabled={readOnly}
          fullWidth
          error={!!errors?.linkedinURL?.message}
          helperText={errors?.linkedinURL?.message}
          placeholder='https://www.linkedin.com/in/alexchibunpoon/'
          onChange={(event) => {
            onChange({
              ...social,
              linkedinURL: event.target.value
            });
          }}
        />
      </FieldWrapper>
    </>
  );
}
