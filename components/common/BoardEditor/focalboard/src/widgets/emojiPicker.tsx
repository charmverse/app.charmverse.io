import React, { FC } from 'react';

import 'emoji-mart/css/emoji-mart.css';
import { Picker, BaseEmoji } from 'emoji-mart';

type Props = {
    onSelect: (emoji: string) => void
}

const EmojiPicker: FC<Props> = (props: Props): JSX.Element => (
  <div
    className='EmojiPicker'
    onClick={(e) => e.stopPropagation()}
  >
    <Picker
      onSelect={(emoji: BaseEmoji) => props.onSelect(emoji.native)}
    />
  </div>
);

export default EmojiPicker;
