import { useTheme } from '@emotion/react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, IconButton, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';
import type { BrandColor } from 'theme/colors';
import { darkModeColors, lightModeColors } from 'theme/colors';

export type PropertyOption = { name: string, color: BrandColor }

export function MemberPropertySelectInput ({
  options,
  onChange
}: {
  options: PropertyOption[];
  onChange: Dispatch<SetStateAction<PropertyOption[]>>;
}) {
  const theme = useTheme();
  const colorRecord = theme.palette.mode === 'dark' ? darkModeColors : lightModeColors;

  return (
    <Stack>
      <FieldLabel>Options</FieldLabel>
      {
            options.map((propertyOption, propertyOptionIndex) => {
              return (
                <Stack flexDirection='row' justifyContent='space-between' mb={1}>
                  <TextField
                    // Using name would cause textfield to lose focus on each stroke
                    key={`${propertyOptionIndex.toString()}`}
                    value={propertyOption.name}
                    onChange={(e) => {
                      onChange(
                        options.map((po, index) => ({ ...po, name: index === propertyOptionIndex ? e.target.value : po.name }))
                      );
                    }}
                  />
                  <Stack gap={1} flexDirection='row'>
                    <Select
                      value={propertyOption.color}
                      displayEmpty={false}
                      onChange={(e) => {
                        onChange(
                          options
                            .map((po, index) => (
                              { ...po, color: index === propertyOptionIndex ? e.target.value as BrandColor : po.color }
                            ))
                        );
                      }}
                      renderValue={(name: BrandColor) => {
                        return (
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              flexDirection: 'row',
                              textTransform: 'capitalize'
                            }}
                          >
                            <div style={{
                              width: 25,
                              height: 25,
                              borderRadius: '50%',
                              backgroundColor: colorRecord[name]
                            }}
                            />
                            <Typography>{name}</Typography>
                          </Box>
                        );
                      }}
                    >
                      {Object.entries(colorRecord).map(([label, color]) => (
                        <MenuItem
                          sx={{
                            display: 'flex',
                            gap: 1,
                            flexDirection: 'row',
                            textTransform: 'capitalize'
                          }}
                          key={label}
                          value={label}
                        >
                          <div style={{
                            width: 25,
                            height: 25,
                            borderRadius: '50%',
                            backgroundColor: color
                          }}
                          />
                          <Typography>{label}</Typography>
                        </MenuItem>
                      ))}
                    </Select>
                    <IconButton color='error'>
                      <DeleteIcon
                        fontSize='small'
                        onClick={() => {
                          onChange(options.filter((_, index) => index !== propertyOptionIndex));
                        }}
                      />
                    </IconButton>
                  </Stack>
                </Stack>
              );
            })
          }

      <Button
        variant='text'
        size='small'
        color='secondary'
        sx={{
          width: 'fit-content',
          my: 1
        }}
        startIcon={<AddOutlinedIcon />}
        onClick={() => {
          onChange([...options, {
            name: '',
            color: 'teal'
          }]);
        }}
      >
        Add option
      </Button>
    </Stack>
  );
}
