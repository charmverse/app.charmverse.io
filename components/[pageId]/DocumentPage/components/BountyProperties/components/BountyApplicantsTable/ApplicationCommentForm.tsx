import styled from '@emotion/styled';
import { Box } from '@mui/system';
import { useState } from 'react';

import Avatar from 'components/common/Avatar';
import Button from 'components/common/Button';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { isTruthy } from 'lib/utilities/types';

interface NewCommentProps {
  initialValue?: ICharmEditorOutput | null;
  $key?: string | number;
  username?: string;
  avatar?: string | null;
  onSubmit: (editorOutput: ICharmEditorOutput) => void;
  disabled?: boolean;
  buttonText?: string;
}

const StyleContainer = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export function ApplicationCommentForm({
  disabled = false,
  initialValue,
  $key,
  username,
  avatar,
  onSubmit,
  buttonText = 'Send'
}: NewCommentProps) {
  const [newComment, setNewComment] = useState<ICharmEditorOutput | null | undefined>(initialValue);
  const [touched, setTouched] = useState(false);

  return (
    <StyleContainer>
      <Avatar size='xSmall' name={username} avatar={avatar} />
      <InlineCharmEditor
        content={newComment?.doc}
        key={$key} // use the size of comments so it resets when the new one is added
        onContentChange={({ doc, rawText }) => {
          setTouched(true);
          setNewComment({ doc, rawText });
        }}
        placeholderText='Add a comment...'
        style={{ fontSize: '14px' }}
        focusOnInit={false}
        readOnly={disabled}
      />

      <Button
        disabled={!touched || (!isTruthy(newComment) && checkIsContentEmpty(newComment))}
        filled={true}
        onClick={() => {
          if (newComment) {
            onSubmit(newComment);
            setTouched(false);
            setNewComment(null);
          }
        }}
      >
        {buttonText}
      </Button>
    </StyleContainer>
  );
}
