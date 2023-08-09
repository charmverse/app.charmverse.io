import styled from '@emotion/styled';
import { CloseOutlined as DeleteIcon } from '@mui/icons-material';
import { Box, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

import { AddAPropertyButton } from 'components/common/BoardEditor/components/properties/AddAProperty';
import { TextInput } from 'components/common/BoardEditor/components/properties/TextInput';

export type RangeProposalCriteria = {
  id: string;
  title: string;
  description?: string | null;
  type: 'range';
  parameters: { min: number | null; max: number | null };
};

type Props = {
  readOnly?: boolean;
  value: RangeProposalCriteria[];
  onChange: (criteria: RangeProposalCriteria[]) => void;
};

const CriteriaRow = styled(Box)`
  .show-on-hover {
    opacity: 0;
    transform: opacity 0.2s ease-in-out;
  }
  &:hover {
    .show-on-hover {
      opacity: 1;
    }
    .octo-propertyvalue:not(.readonly) {
      background-color: var(--mui-action-hover);
    }
  }
  .to-pseudo-element {
    position: relative;
  }
  .to-pseudo-element::before {
    content: '-';
    left: -8px;
    top: 4px;
    position: absolute;
    font-size: 16px;
    color: var(--secondary-text);
  }
`;

export function ProposalRubricCriteriaInput({ readOnly, value, onChange }: Props) {
  const [criteriaList, setCriteriaList] = useState<RangeProposalCriteria[]>([]);

  function addCriteria() {
    if (readOnly) {
      return;
    }
    const lastCriteria = criteriaList[criteriaList.length - 1]?.parameters;
    const parameters = { min: lastCriteria?.min || 1, max: lastCriteria?.max || 5 };
    const newCriteria: RangeProposalCriteria = {
      id: uuid(),
      title: '',
      type: 'range',
      parameters
    };
    const updatedList = [...criteriaList, newCriteria];
    setCriteriaList(updatedList);
    // onChange(criteriaList); - no need to update the backend immediately something is entered?
  }

  function deleteCriteria(id: string) {
    if (readOnly) {
      return;
    }
    const updatedList = criteriaList.filter((c) => c.id !== id);
    setCriteriaList(updatedList);
    onChange(criteriaList);
  }

  function setCriteriaProperty(id: string, updates: Partial<RangeProposalCriteria>) {
    if (readOnly) {
      return;
    }
    const criteria = criteriaList.find((c) => c.id === id);
    if (criteria) {
      Object.assign(criteria, updates);
      setCriteriaList([...criteriaList]);
      if (criteriaList.every(isValidCriteria)) {
        onChange(criteriaList);
      }
    }
  }

  useEffect(() => {
    // console.log('set criteria since value changed', value);
    setCriteriaList(value);
  }, [value]);

  useEffect(() => {
    function upHandler(event: KeyboardEvent) {
      const criteriaId = (event.target as HTMLElement)?.dataset.criteria;
      const criteria = criteriaList.find((c) => c.id === criteriaId);
      const parameterType = (event.target as HTMLElement)?.dataset.parameterType as 'min' | 'max';
      if (criteria && event.key === 'ArrowUp') {
        const newValue = (criteria.parameters[parameterType] || 0) + 1;
        const parameters = {
          ...criteria.parameters,
          [parameterType]: newValue
        };
        setCriteriaProperty(criteria.id, { parameters });
      } else if (criteria && event.key === 'ArrowDown') {
        const newValue = (criteria.parameters[parameterType] || 0) - 1;
        const parameters = {
          ...criteria.parameters,
          [parameterType]: newValue
        };
        setCriteriaProperty(criteria.id, { parameters });
      }
    }
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keyup', upHandler);
    };
  }, [criteriaList]);

  return (
    <>
      {criteriaList.map((criteria) => (
        <CriteriaRow key={criteria.id} display='flex' alignItems='flex-start' gap={1} mb={1}>
          <TextInput
            inputProps={{ autoFocus: true }}
            displayType='details'
            fullWidth={false}
            onChange={(title) => setCriteriaProperty(criteria.id, { title })}
            placeholderText='Add a label...'
            readOnly={readOnly}
            value={criteria.title}
          />
          <Box maxHeight='3em'>
            <TextInput
              multiline={false}
              onChange={(description) => setCriteriaProperty(criteria.id, { description })}
              placeholderText='Add a description...'
              readOnly={readOnly}
              sx={{ flexGrow: 1, width: '100%' }}
              value={criteria.description ?? ''}
            />
          </Box>
          <Box display='flex' gap={1} alignItems='flex-start'>
            {/* <FormLabel color='secondary' sx={{ fontSize: 12, pt: 0.5 }}>
                  Range:
                </FormLabel> */}
            <Grid container width={90} spacing={1}>
              <Grid xs item>
                <div>
                  <TextInput
                    displayType='details'
                    inputProps={{
                      'data-criteria': criteria.id,
                      'data-parameter-type': 'min'
                    }}
                    onChange={(min) => {
                      setCriteriaProperty(criteria.id, {
                        parameters: { ...criteria.parameters, min: getNumberFromString(min) }
                      });
                    }}
                    readOnly={readOnly}
                    sx={{ input: { textAlign: 'center', minWidth: '2.5em !important' } }}
                    value={criteria.parameters.min?.toString() || ''}
                  />
                  <Typography
                    align='center'
                    component='div'
                    className='show-on-hover'
                    color='secondary'
                    variant='caption'
                  >
                    min
                  </Typography>
                </div>
              </Grid>
              <Grid xs item>
                <div className='to-pseudo-element'>
                  <TextInput
                    displayType='details'
                    // store props on DOM for keyboard events
                    inputProps={{
                      'data-criteria': criteria.id,
                      'data-parameter-type': 'max'
                    }}
                    onChange={(max) => {
                      setCriteriaProperty(criteria.id, {
                        parameters: { ...criteria.parameters, max: getNumberFromString(max) }
                      });
                    }}
                    readOnly={readOnly}
                    sx={{ input: { textAlign: 'center', minWidth: '2.5em !important' } }}
                    value={criteria.parameters.max?.toString() || ''}
                  />
                  <Typography
                    align='center'
                    component='div'
                    className='show-on-hover'
                    color='secondary'
                    variant='caption'
                  >
                    max
                  </Typography>
                </div>
              </Grid>
            </Grid>
          </Box>
          {!readOnly && (
            <div className='show-on-hover delete-icon'>
              <Tooltip title='Delete'>
                <IconButton size='small' onClick={() => deleteCriteria(criteria.id)}>
                  <DeleteIcon color='secondary' fontSize='small' />
                </IconButton>
              </Tooltip>
            </div>
          )}
        </CriteriaRow>
      ))}
      {!readOnly && (
        <AddAPropertyButton style={{ flex: 'none', margin: 0 }} onClick={addCriteria}>
          + Add a criteria
        </AddAPropertyButton>
      )}
    </>
  );
}

function getNumberFromString(strValue: string): number | null {
  const parsedString = parseInt(strValue, 10);
  return parsedString || parsedString === 0 ? parsedString : null;
}

function isValidCriteria(criteria: RangeProposalCriteria) {
  if (criteria.type === 'range') {
    if (
      (!criteria.parameters.min && criteria.parameters.min !== 0) ||
      (!criteria.parameters.max && criteria.parameters.max !== 0)
    ) {
      // Range values are invalid
      return false;
    }
    if (criteria.parameters.min >= criteria.parameters.max) {
      // Minimum must be less than Maximum
      return false;
    }
  }
  return true;
}
