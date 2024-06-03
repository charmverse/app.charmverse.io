import { Checkbox, Divider, Stack, Typography } from '@mui/material';

import { useProposalsBoardAdapter } from 'components/proposals/ProposalPage/components/ProposalProperties/hooks/useProposalsBoardAdapter';

import type { SelectedProposalProperties } from './ProposalSourcePropertiesDialog';

export function CustomPropertiesList({
  selectedProperties,
  setSelectedProperties
}: {
  selectedProperties: SelectedProposalProperties;
  setSelectedProperties: (selectedProperties: SelectedProposalProperties) => void;
}) {
  const { boardCustomProperties } = useProposalsBoardAdapter();
  const isAllChecked =
    boardCustomProperties.fields.cardProperties.length === selectedProperties.customProperties.length;

  if (boardCustomProperties.fields.cardProperties.length === 0) {
    return <Typography>No custom properties available</Typography>;
  }

  return (
    <Stack>
      <Stack direction='row' alignItems='center'>
        <Checkbox
          size='small'
          onClick={() => {
            if (isAllChecked) {
              setSelectedProperties({
                ...selectedProperties,
                customProperties: []
              });
            } else {
              setSelectedProperties({
                ...selectedProperties,
                customProperties: boardCustomProperties.fields.cardProperties.map((p) => p.id)
              });
            }
          }}
          checked={isAllChecked}
        />
        <Typography fontWeight='bold'>Select All</Typography>
      </Stack>
      <Stack>
        {boardCustomProperties.fields.cardProperties.map((property) => {
          const isSelected = selectedProperties.customProperties.includes(property.id);
          return (
            <Stack key={property.id} direction='row' alignItems='center'>
              <Checkbox
                size='small'
                checked={isSelected}
                onClick={() => {
                  if (isSelected) {
                    setSelectedProperties({
                      ...selectedProperties,
                      customProperties: selectedProperties.customProperties.filter((p) => p !== property.id)
                    });
                  } else {
                    setSelectedProperties({
                      ...selectedProperties,
                      customProperties: [...selectedProperties.customProperties, property.id]
                    });
                  }
                }}
              />
              <Typography>{property.name}</Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}

export function CustomPropertiesReadonlyList({
  selectedProperties
}: {
  selectedProperties: SelectedProposalProperties;
}) {
  const { boardCustomProperties } = useProposalsBoardAdapter();

  if (selectedProperties.customProperties.length === 0) {
    return null;
  }

  const selectedCustomProperties = boardCustomProperties.fields.cardProperties.filter((property) =>
    selectedProperties.customProperties.includes(property.id)
  );

  return (
    <Stack>
      <Typography fontWeight='bold' variant='body2'>
        Custom Properties
      </Typography>
      <Stack gap={0.5} mt={0.5}>
        {selectedCustomProperties.map((property) => {
          return (
            <Typography fontWeight={500} color='secondary' variant='subtitle1' key={property.id}>
              {property.name}
            </Typography>
          );
        })}
      </Stack>
      <Divider
        sx={{
          my: 2
        }}
      />
    </Stack>
  );
}
