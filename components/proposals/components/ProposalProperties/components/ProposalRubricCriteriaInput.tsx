import styled from '@emotion/styled';
import { Box, FormControlLabel, FormLabel, FormGroup, Grid, Select, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

import { AddAPropertyButton } from 'components/common/BoardEditor/components/properties/AddAProperty';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { TextInput } from 'components/common/BoardEditor/focalboard/src/widgets/TextInput';

export type RangeProposalCriteria = {
  id: string;
  title: string;
  description?: string | null;
  type: 'range';
  parameters: { min: number; max: number };
};

type Props = {
  value: RangeProposalCriteria[];
  onChange: (criteria: RangeProposalCriteria[]) => void;
};

const CriteriaRow = styled(Box)`
  .range-label {
    opacity: 0;
    transform: opacity 0.2s ease-in-out;
  }
  &:hover {
    .range-label {
      opacity: 1;
    }
  }
`;

export function ProposalRubricCriteriaInput({ value, onChange }: Props) {
  const [criteriaList, setCriteriaList] = useState<RangeProposalCriteria[]>([]);

  function addCriteria() {
    const lastCriteria = criteriaList[criteriaList.length - 1]?.parameters;
    const parameters = { min: lastCriteria?.min || 1, max: lastCriteria?.max || 5 };
    const newCriteria: RangeProposalCriteria = {
      id: uuid(),
      title: 'New question',
      type: 'range',
      parameters
    };
    const updatedList = [...criteriaList, newCriteria];
    setCriteriaList(updatedList);
    onChange(criteriaList);
  }

  function updateCriteria(id: string, updates: Partial<RangeProposalCriteria>) {
    const criteria = criteriaList.find((c) => c.id === id);
    if (criteria) {
      Object.assign(criteria, updates);
      setCriteriaList([...criteriaList]);
      onChange(criteriaList);
    }
  }

  useEffect(() => {
    // console.log('set criteria since value changed', value);
    setCriteriaList(value);
  }, [value]);

  return (
    <>
      <Box pl={1} pt={1}>
        {criteriaList.map((criteria) => (
          <CriteriaRow key={criteria.id} display='flex' alignItems='flex-start' gap={2}>
            <TextInput
              displayType='details'
              fullWidth={false}
              placeholderText='Title...'
              value={criteria.title}
              onChange={(title) => updateCriteria(criteria.id, { title })}
              sx={{ fontSize: 14 }}
            />
            <TextInput
              multiline
              placeholderText='Add a description...'
              displayType='details'
              fullWidth={false}
              value={criteria.description ?? ''}
              onChange={(description) => updateCriteria(criteria.id, { description })}
              sx={{ fontSize: 14, flexGrow: 1 }}
            />
            <Box display='flex' gap={1} alignItems='flex-start'>
              {/* <FormLabel color='secondary' sx={{ fontSize: 12, pt: 0.5 }}>
                  Range:
                </FormLabel> */}
              <Grid container width={70}>
                <Grid xs item>
                  <div>
                    <TextInput
                      displayType='details'
                      value={criteria.parameters.min.toString()}
                      onChange={(min) => {
                        if (min) {
                          updateCriteria(criteria.id, {
                            parameters: { ...criteria.parameters, min: parseInt(min, 10) }
                          });
                        }
                      }}
                    />
                    <Typography component='div' className='range-label' color='secondary' variant='caption'>
                      min
                    </Typography>
                  </div>
                </Grid>
                <Grid xs item>
                  -
                </Grid>
                <Grid xs item>
                  <TextInput
                    displayType='details'
                    value={criteria.parameters.max.toString()}
                    onChange={(max) => {
                      if (max) {
                        updateCriteria(criteria.id, {
                          parameters: { ...criteria.parameters, max: parseInt(max, 10) }
                        });
                      }
                    }}
                  />
                  <Typography component='div' className='range-label' color='secondary' variant='caption'>
                    max
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </CriteriaRow>
        ))}
      </Box>
      <AddAPropertyButton style={{ flex: 'none', margin: 0 }} onClick={addCriteria}>
        + Add a criteria
      </AddAPropertyButton>
    </>
  );
}
