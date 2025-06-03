import type { ProposalRubricCriteriaAnswer } from '@charmverse/core/prisma-client';
import { DeleteOutlined as DeleteIcon, DragIndicator } from '@mui/icons-material';
import { styled, Box, Grid, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from '@packages/lib/proposals/rubric/interfaces';
import type { RangeProposalCriteria } from '@packages/lib/proposals/workflows/getNewCriteria';
import { getNewCriteria } from '@packages/lib/proposals/workflows/getNewCriteria';
import { getNumberFromString } from '@packages/lib/utils/numbers';
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AddAPropertyButton } from 'components/common/DatabaseEditor/components/properties/AddAProperty';
import { TextInput } from 'components/common/DatabaseEditor/components/properties/TextInput';
import { DraggableListItem } from 'components/common/DraggableListItem';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import ReactDndProvider from 'components/common/ReactDndProvider';

type Props = {
  readOnly?: boolean;
  showDeleteConfirmation?: boolean;
  value: RangeProposalCriteria[];
  onChange: (criteria: RangeProposalCriteria[]) => void;
  answers: ProposalRubricCriteriaAnswer[];
};

export const CriteriaRow = styled(Box)`
  position: relative;
  flex-direction: column;
  border: 1px solid var(--input-border);
  padding: 4px;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    .show-on-hover {
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
    &:hover {
      .show-on-hover {
        opacity: 1;
      }
      .octo-propertyvalue:not(.readonly) {
        background-color: var(--mui-action-hover);
      }
    }
  }

  .drag-indicator {
    cursor: grab;
    margin-top: 7px;
    margin-left: -28px;
    position: absolute;
  }

  .to-pseudo-element {
    position: relative;
  }
  .to-pseudo-element::before {
    content: 'to';
    left: -24px;
    top: 6px;
    position: absolute;
    font-size: 16px;
    color: var(--secondary-text);
  }
`;
export function RubricCriteriaSettings({
  readOnly,
  showDeleteConfirmation,
  value: criteriaList,
  onChange,
  answers
}: Props) {
  const [rubricCriteriaIdToDelete, setRubricCriteriaIdToDelete] = useState<string | null>(null);

  function addCriteria() {
    if (readOnly) {
      return;
    }
    const lastCriteria = criteriaList[criteriaList.length - 1];
    const newCriteria = getNewCriteria(lastCriteria);
    const updatedList = [...criteriaList, newCriteria];
    onChange(updatedList);
  }

  function deleteCriteria(id: string) {
    if (readOnly || !id) {
      return;
    }
    setRubricCriteriaIdToDelete(null);
    const updatedList = criteriaList.filter((c) => c.id !== id);

    onChange(updatedList);
  }

  const setCriteriaProperty = useCallback(
    (id: string, updates: Partial<RangeProposalCriteria>) => {
      if (readOnly) {
        return;
      }
      const combinedCriteriaList = [...criteriaList];
      const criteria = combinedCriteriaList.find((c) => c.id === id);

      if (criteria) {
        Object.assign(criteria, updates);

        if (criteriaList.every((rubricCriteria) => isValidCriteria(rubricCriteria, answers))) {
          onChange(combinedCriteriaList);
        }
      }
    },
    [answers, criteriaList, onChange, readOnly]
  );

  const debouncedSetCriteriaProperty = useMemo(() => debounce(setCriteriaProperty, 300), [setCriteriaProperty]);

  useEffect(() => {
    return () => {
      debouncedSetCriteriaProperty.cancel();
    };
  }, [debouncedSetCriteriaProperty]);

  function handleClickDelete(criteriaId: string) {
    if (showDeleteConfirmation) {
      setRubricCriteriaIdToDelete(criteriaId);
    } else {
      deleteCriteria(criteriaId);
    }
  }
  async function changeOptionsOrder(draggedProperty: string, droppedOnProperty: string) {
    if (readOnly) {
      return;
    }
    const newOrder = [...criteriaList];
    const propIndex = newOrder.findIndex((val) => val.id === draggedProperty); // find the property that was dragged
    const deletedElements = newOrder.splice(propIndex, 1); // remove the dragged property from the array
    const droppedOnIndex = newOrder.findIndex((val) => val.id === droppedOnProperty); // find the index of the space that was dropped on
    const newIndex = propIndex <= droppedOnIndex ? droppedOnIndex + 1 : droppedOnIndex; // if the dragged property was dropped on a space with a higher index, the new index needs to include 1 extra
    newOrder.splice(newIndex, 0, deletedElements[0]); // add the property to the new index

    onChange(newOrder);
  }

  return (
    <ReactDndProvider>
      {criteriaList.map((criteria) => (
        <DraggableListItem
          key={criteria.id}
          name='rubric-option'
          itemId={criteria.id}
          draggable={!readOnly}
          changeOrderHandler={changeOptionsOrder}
        >
          <CriteriaRow display='flex' alignItems='flex-start' gap={1} mb={1}>
            {!readOnly && (
              <div className='drag-indicator show-on-hover'>
                <DragIndicator color='secondary' fontSize='small' />
              </div>
            )}
            <Box display='flex' alignItems='center' width='100%'>
              <TextField
                sx={{ flexGrow: 1 }}
                multiline
                fullWidth
                onChange={(e) => debouncedSetCriteriaProperty(criteria.id, { title: e.target.value })}
                placeholder='Add a label...'
                disabled={readOnly}
                defaultValue={criteria.title || ''}
                data-test='edit-rubric-criteria-label'
              />
              {!readOnly && (
                <Box pl={0.5}>
                  <Tooltip title='Delete criteria'>
                    <IconButton onClick={() => handleClickDelete(criteria.id)} size='small'>
                      <DeleteIcon color='secondary' fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            <TextField
              multiline
              fullWidth
              data-test='edit-rubric-criteria-description'
              onChange={(e) => debouncedSetCriteriaProperty(criteria.id, { description: e.target.value })}
              placeholder='Add a description...'
              disabled={readOnly}
              sx={{ flexGrow: 1, width: '100%' }}
              defaultValue={criteria.description ?? ''}
            />
            <Grid container spacing={4}>
              <Grid size='grow'>
                <div>
                  <TextField
                    inputProps={{ type: 'number' }}
                    data-test='edit-rubric-criteria-min-score'
                    onChange={(e) => {
                      debouncedSetCriteriaProperty(criteria.id, {
                        parameters: { ...criteria.parameters, min: getNumberFromString(e.target.value) }
                      });
                    }}
                    disabled={readOnly}
                    defaultValue={criteria.parameters.min}
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
              <Grid size='grow'>
                <div className='to-pseudo-element'>
                  <TextField
                    inputProps={{
                      type: 'number',
                      min: typeof criteria.parameters.min === 'number' ? criteria.parameters.min + 1 : undefined
                    }}
                    data-test='edit-rubric-criteria-max-score'
                    onChange={(e) => {
                      debouncedSetCriteriaProperty(criteria.id, {
                        parameters: { ...criteria.parameters, max: getNumberFromString(e.target.value) }
                      });
                    }}
                    disabled={readOnly}
                    defaultValue={criteria.parameters.max}
                  />
                  <Typography
                    align='center'
                    component='div'
                    className='show-on-hover'
                    variant='caption'
                    color='secondary'
                  >
                    max
                  </Typography>
                </div>
              </Grid>
            </Grid>
          </CriteriaRow>
        </DraggableListItem>
      ))}
      {!readOnly && (
        <ConfirmDeleteModal
          title='Confirm criteria deletion'
          open={!!rubricCriteriaIdToDelete}
          onClose={() => setRubricCriteriaIdToDelete(null)}
          buttonText='Delete rubric criteria'
          onConfirm={() => {
            deleteCriteria(rubricCriteriaIdToDelete!);
          }}
          question='Are you sure you want to delete this criteria? Any linked answers will also be deleted'
        />
      )}
      <AddAPropertyButton
        data-test='add-rubric-criteria-button'
        style={{ display: readOnly ? 'none' : 'block', flex: 'none', margin: 0 }}
        onClick={addCriteria}
      >
        + Add a criteria
      </AddAPropertyButton>
    </ReactDndProvider>
  );
}
export function IntegerInput({
  value,
  onChange,
  readOnly,
  readOnlyMessage,
  inputProps,
  disabled,
  maxWidth,
  sx
}: {
  value?: number | string | null;
  onChange: (num: number | null) => void;
  readOnly?: boolean;
  readOnlyMessage?: string;
  inputProps?: any;
  disabled?: boolean;
  maxWidth?: number;
  sx?: any;
}) {
  return (
    <TextInput
      displayType='details'
      fullWidth={!maxWidth}
      inputProps={{ disabled, type: 'number', ...inputProps }}
      onChange={(newValue) => onChange(getNumberFromString(newValue))}
      readOnly={readOnly}
      readOnlyMessage={readOnlyMessage}
      sx={{
        input: { textAlign: 'center', minWidth: '2.5em !important', maxWidth },
        ...sx
      }}
      value={value?.toString() || ''}
    />
  );
}

function isValidCriteria(criteria: RangeProposalCriteria, rubricAnswers: ProposalRubricCriteriaAnswer[]) {
  const min = criteria.parameters.min;
  const max = criteria.parameters.max;
  for (const answer of rubricAnswers as ProposalRubricCriteriaAnswerWithTypedResponse[]) {
    if (
      (answer.rubricCriteriaId === criteria.id && typeof min === 'number' && answer.response.score < min) ||
      (typeof max === 'number' && answer.response.score > max)
    ) {
      return false;
    }
  }

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
    return true;
  }
  // unrecognized type
  throw new Error(`Unrecognized criteria type: ${criteria.type}`);
}
