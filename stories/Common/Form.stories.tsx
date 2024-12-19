import { Box, Grid, Paper, Stack, Typography } from '@mui/material';
import type { SelectOptionType } from '@root/lib/proposals/forms/interfaces';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { NumericFieldWithButtons } from 'components/common/form/fields/NumericFieldWithButtons';
import { SelectField } from 'components/common/form/fields/SelectField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import { SocialInputs } from 'components/settings/profile/components/SocialInputs';
import { TimezoneAutocomplete } from 'components/settings/profile/components/TimezoneAutocomplete';
import UserDescription from 'components/settings/profile/components/UserDescription';
import type { Social } from 'lib/members/interfaces';

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
    <Paper sx={{ p: 4 }}>
      <Grid container direction='column' spacing={2} mt={1} maxWidth={700} mx='auto'>
        <Grid item>
          <UserDescription description={description} onChange={saveDescription} />
        </Grid>
        <Grid item>
          <TimezoneAutocomplete
            userTimezone={newTimezone}
            onChange={(timezone) => setNewTimezone(timezone || 'America/New_York')}
          />
        </Grid>
        <SocialInputs social={text as Social} onChange={saveSocial} />
        <Box display='flex' justifyContent='flex-end' gap={2} mt={4}>
          <Button color='error'>Cancel</Button>
          <Button>Save</Button>
        </Box>
      </Grid>
    </Paper>
  );
}

export function InputFields() {
  const [number, setNumber] = useState('');
  const [option, setOption] = useState('');
  const [optionMultiselect, setOptionMultiselect] = useState('');

  const [text, setText] = useState('');

  const options = [
    { id: '1', name: 'one', color: 'blue' },
    { id: '2', name: 'two', color: 'orange' },
    { id: '3', name: 'three', color: 'red' },
    { id: '4', name: 'four', color: 'yellow' }
  ] as SelectOptionType[];

  return (
    <Paper sx={{ p: 4 }}>
      <Box display='flex' flexDirection='column' gap={1} mx='auto' maxWidth={700}>
        <NumberInputField value={number} onChange={(e) => setNumber(e.target.value)} label='NumberInputField' />

        <NumberInputField
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          disableArrows
          label='NumberInputField - no arrow icons'
        />

        <NumberInputField
          disabled
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          label='NumberInputField - disabled'
        />

        <NumberInputField
          error='error'
          // @ts-ignore
          helperText='error message'
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          label='NumberInputField - error'
        />
        <NumberInputField
          disabled
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          label='NumberInputField - disabled'
        />

        <SelectField label='SelectField' options={options} value={option} onChange={(value) => setOption(value)} />

        <SelectField
          multiselect
          label='SelectField - multiselect'
          options={options}
          value={optionMultiselect}
          onChange={(value) => setOptionMultiselect(value)}
        />

        <SelectField
          disabled
          label='SelectField - disabled'
          options={options}
          value={option}
          onChange={(value) => setOption(value)}
        />

        <SelectField
          error='error'
          // @ts-ignore
          helperText='error message'
          label='SelectField - error'
          options={options}
          value={optionMultiselect}
          onChange={(value) => setOptionMultiselect(value)}
        />

        <TextInputField label='TextInputField' value={text} onChange={(e) => setText(e.target.value)} />

        <TextInputField
          disabled
          label='TextInputField - disabled'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <TextInputField
          error='error'
          // @ts-ignore
          helperText='error message'
          label='TextInputField - error'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Box>
    </Paper>
  );
}

export function NumericField() {
  const [val1, setVal1] = useState(10);
  const [val2, setVal2] = useState(3);

  return (
    <Stack gap={4}>
      <Stack alignItems='flex-start'>
        <Typography variant='subtitle1'>Numeric field</Typography>

        <NumericFieldWithButtons value={val1} onChange={setVal1} />
      </Stack>

      <Stack alignItems='flex-start'>
        <Typography variant='subtitle1'>Numeric field with min 1 and max 5</Typography>

        <NumericFieldWithButtons value={val2} onChange={setVal2} min={1} max={5} />
      </Stack>

      <Stack alignItems='flex-start'>
        <Typography variant='subtitle1'>Disabled field</Typography>

        <NumericFieldWithButtons value={5} onChange={() => {}} disabled />
      </Stack>
    </Stack>
  );
}
