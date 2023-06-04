import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { ListItemIcon, ListItemText, MenuItem, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';

import type { PageMeta } from 'lib/pages';
import { fancyTrim } from 'lib/utilities/strings';

const maxTitleLength = 35;

type Props = {
  disabled?: boolean;
  options: PageMeta[];
  value: PageMeta | null;
  onChange: (value: PageMeta | null) => void;
};

export default function ProposalTemplateInput({ disabled, options, value, onChange }: Props) {
  return (
    <Autocomplete
      disabled={disabled}
      value={value}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      filterSelectedOptions
      sx={{ minWidth: 150, width: '100%' }}
      options={options}
      autoHighlight
      clearIcon={null}
      renderOption={(_props, page) => (
        <MenuItem {..._props}>
          <ListItemIcon>
            <DescriptionOutlinedIcon />
          </ListItemIcon>
          <ListItemText>{fancyTrim(page.title || 'Untitled', maxTitleLength)}</ListItemText>
        </MenuItem>
      )}
      ChipProps={{
        // Hack for preventing delete from showing
        onDelete: null as any
      }}
      noOptionsText='No templates available'
      renderInput={(params) => <TextField {...params} placeholder='Select template' size='small' />}
      getOptionLabel={(templatePage: PageMeta) => {
        // Regular option
        return templatePage?.title;
      }}
      isOptionEqualToValue={(templatePage, checkValue) => {
        return templatePage.id === checkValue.id;
      }}
      onChange={(_, _value) => {
        onChange(_value);
      }}
    />
  );
}
