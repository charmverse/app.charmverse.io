import { Check } from '@mui/icons-material';
import { Box, Grid } from '@mui/material';
import { useState } from 'react';

import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { SelectField } from 'components/common/form/fields/SelectField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import SocialInputs from 'components/profile/components/SocialInputs';
import { TimezoneAutocomplete } from 'components/profile/components/TimezoneAutocomplete';
import UserDescription from 'components/profile/components/UserDescription';
import type { Social } from 'components/profile/interfaces';

import Button from '../Button';
import type { SelectOptionType } from '../form/fields/Select/interfaces';

export default {
  title: 'common/Form',
  component: UserDescription
};

export function FormComposition() {
  const [newTimezone, setNewTimezone] = useState('America/New_York');
  const [description, setDescription] = useState('');
  const [text, setText] = useState<Social>({
    twitterURL: '',
    githubURL: '',
    discordUsername: '',
    linkedinURL: ''
  });

  const saveDescription = async (_description: string) => {
    setDescription(_description);
  };

  const saveSocial = async (_description: Social) => {
    setText(_description);
  };

  return (
    <Grid container direction='column' spacing={2} mt={1} maxWidth={700} mx='auto'>
      <Grid item>
        <UserDescription currentDescription={description} save={saveDescription} />
      </Grid>
      <Grid item>
        <TimezoneAutocomplete
          userTimezone={newTimezone}
          save={(timezone) => setNewTimezone(timezone || 'America/New_York')}
        />
      </Grid>
      <SocialInputs social={text as Social} save={saveSocial} />
      <Box display='flex' justifyContent='flex-end' gap={2} mt={4}>
        <Button color='error'>Cancel</Button>
        <Button>Save</Button>
      </Box>
    </Grid>
  );
}

export function InputFields() {
  const [number, setNumber] = useState('');
  const [option, setOption] = useState('');
  const [text, setText] = useState('');

  const options = [
    { id: '1', name: 'one', color: 'blue' },
    { id: '2', name: 'two', color: 'orange' },
    { id: '3', name: 'three', color: 'red' },
    { id: '4', name: 'four', color: 'yellow' }
  ] as SelectOptionType[];
  return (
    <Box display='flex' flexDirection='column' gap={1} mx='auto' maxWidth={700}>
      <NumberInputField
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        label='NumberInputField'
        iconLabel={<Check />}
      />

      <SelectField
        multiselect
        label='SelectField'
        options={options}
        value={option}
        onChange={(value) => setOption(value)}
      />

      <TextInputField label='TextInputField' value={text} onChange={(e) => setText(e.target.value)} />
    </Box>
  );
}
