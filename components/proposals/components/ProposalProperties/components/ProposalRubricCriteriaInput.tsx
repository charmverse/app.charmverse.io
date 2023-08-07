import { Box, Grid, Select, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

import { AddAPropertyButton } from 'components/common/BoardEditor/components/properties/AddAProperty';

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

export function ProposalRubricCriteriaInput({ value, onChange }: Props) {
  const [criteria, setCriteria] = useState<RangeProposalCriteria[]>([]);

  function addCriteria() {
    const lastCriteria = criteria[criteria.length - 1]?.parameters;
    const parameters = { min: lastCriteria?.min || 1, max: lastCriteria?.max || 5 };
    const newCriteria: RangeProposalCriteria = {
      id: uuid(),
      title: 'New question',
      type: 'range',
      parameters
    };
    setCriteria([...criteria, newCriteria]);
  }

  useEffect(() => {
    setCriteria(value);
  }, [value]);

  return (
    <Box p={1}>
      <Typography variant='subtitle1' sx={{ mb: 1 }}>
        Properties
      </Typography>
      {criteria.map((question) => (
        <Grid key={question.id} container>
          <Grid item xs={12} md={9}>
            <Grid item container>
              <Grid xs item>
                Title:
              </Grid>
              <Grid xs item flexGrow={1}>
                {question.title}
              </Grid>
            </Grid>
            <Grid item container>
              <Grid xs item>
                Description:
              </Grid>
              <Grid xs item flexGrow={1}>
                {question.description}
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={3}>
            <Grid item container>
              <Grid item>{question.parameters.min}</Grid>
              <Grid item>{question.parameters.max}</Grid>
            </Grid>
          </Grid>
        </Grid>
      ))}
      <AddAPropertyButton onClick={addCriteria}>+ Add a criteria</AddAPropertyButton>
    </Box>
  );
}
