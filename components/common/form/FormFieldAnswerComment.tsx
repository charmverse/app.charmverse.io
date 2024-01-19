import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import { IconButton, Tooltip } from '@mui/material';

import { InlineCommentInput } from 'components/[pageId]/DocumentPage/components/InlineCommentInput';

import PopperPopup from '../PopperPopup';

export function FormFieldAnswerComment({ disabled, isReviewer }: { isReviewer: boolean; disabled?: boolean }) {
  return (
    <PopperPopup
      popupContent={<InlineCommentInput pageType='proposal' handleSubmit={() => {}} />}
      disablePopup={disabled}
    >
      <Tooltip
        title={
          isReviewer && !disabled
            ? 'Add a comment to the form field answer'
            : "You don't have permission to add a comment"
        }
      >
        <IconButton
          sx={{
            mt: 1
          }}
          disabled={!isReviewer || disabled}
          color='secondary'
        >
          <AddCommentOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    </PopperPopup>
  );
}
