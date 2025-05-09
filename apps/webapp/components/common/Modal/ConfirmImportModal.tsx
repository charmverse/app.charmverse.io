import { FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ChangeEvent, ReactNode } from 'react';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import type { ModalProps } from 'components/common/Modal';
import { Modal } from 'components/common/Modal';

export type ImportAction = 'merge' | 'delete';

type Props = Pick<ModalProps, 'onClose' | 'open' | 'size'> & {
  question: ReactNode;
  title?: string;
  buttonText?: string;
  secondaryButtonText?: string;
  onConfirm: (event: ChangeEvent<HTMLInputElement>, value: ImportAction) => void;
  onClose: () => void;
};

export default function ConfirmImportModal({
  open,
  question,
  buttonText = 'Import',
  title,
  size,
  secondaryButtonText = 'Cancel',
  onConfirm,
  onClose
}: Props) {
  const [value, setValue] = useState<ImportAction>('merge');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value as ImportAction);
  };

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    onConfirm(event, value);
    onClose();
    // reset to default to be sure the user doesn't accidentally delete all his cards if he opens the modal again
    setValue('merge');
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size={size}>
      <FormLabel id='new-radio-buttons-group-label'>
        {typeof question === 'string' ? <Typography>{question}</Typography> : question}
      </FormLabel>
      <RadioGroup
        aria-labelledby='radio-buttons-group-label'
        name='radio-buttons-group'
        value={value}
        onChange={handleChange}
      >
        <FormControlLabel value='merge' control={<Radio />} label='Merge csv with current database' />
        <FormControlLabel value='delete' control={<Radio />} label='Delete the current database and import csv' />
      </RadioGroup>

      <Box sx={{ columnSpacing: 2, mt: 3, display: 'flex' }}>
        <Button
          color='primary'
          component='label'
          htmlFor='confirmcsvfile'
          sx={{
            mr: 2,
            fontWeight: 'bold',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {buttonText}
          <input hidden type='file' name='confirmcsvfile' id='confirmcsvfile' accept='.csv' onChange={handleImport} />
        </Button>

        <Button color='secondary' variant='outlined' onClick={onClose}>
          {secondaryButtonText}
        </Button>
      </Box>
    </Modal>
  );
}
