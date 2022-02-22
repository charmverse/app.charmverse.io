import { Autocomplete, Box, TextField } from '@mui/material';
import Image from 'next/image';
import { useContributors } from 'hooks/useContributors';
import { Contributor } from 'models';
import { FiatCurrencyList, FiatCurrency } from '../../../models/Currency';

export interface IInputSearchContributorProps {
  onChange?: (id: string) => any
  defaultValue?: string
}

export function InputSearchContributor ({ onChange = () => {}, defaultValue }: IInputSearchContributorProps) {

  const [contributors] = useContributors();

  const preselectedContributor = defaultValue ? contributors.find(contributor => {
    return contributor.id === defaultValue;
  }) : null;

  function emitValue (selectedUser: Contributor) {

    if (selectedUser === null) {
      return;
    }

    const matchingContributor = contributors.find(contributor => {
      return contributor.id === selectedUser.id;
    });

    if (matchingContributor) {
      onChange(matchingContributor.id);
    }
  }

  if (!contributors) {
    return null;
  }

  return (
    <Autocomplete
      defaultValue={preselectedContributor}
      onChange={(event, value) => {
        emitValue(value as any);
      }}
      sx={{ minWidth: 150 }}
      options={contributors}
      autoHighlight
      getOptionLabel={option => option.id}
      renderOption={(props, option) => (
        <Box component='li' sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
          {option.id}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps
          }}
        />
      )}
    />
  );
}
