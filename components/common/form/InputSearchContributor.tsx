import { Autocomplete, Box, TextField } from '@mui/material';
import Image from 'next/image';
import { useContributors } from 'hooks/useContributors';
import { Contributor } from 'models';
import { FiatCurrencyList, FiatCurrency } from '../../../models/Currency';

export interface IInputSearchContributorProps {
  onChange?: (id: string) => any
}

export function InputSearchContributor ({ onChange = () => {} }: IInputSearchContributorProps) {

  const [contributors] = useContributors();

  function emitValue (userId: string) {

    if (userId === null) {
      return;
    }

    const matchingContributor = contributors.find(contributor => {
      return contributor.id === userId;
    });

    if (matchingContributor) {
      onChange(userId);
    }
  }

  if (!contributors) {
    return null;
  }

  return (
    <Autocomplete
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
