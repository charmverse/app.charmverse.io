import type { BaseEmoji } from 'emoji-mart';
import { Picker } from 'emoji-mart';
import type { FC } from 'react';
import React from 'react';

import 'emoji-mart/css/emoji-mart.css';

type Props = {
    onSelect: (emoji: string) => void;
}

function EmojiPicker (props: Props): JSX.Element {
  return (
    <div
      className='EmojiPicker'
      onClick={(e) => e.stopPropagation()}
    >
      <Picker
        onSelect={(emoji: BaseEmoji) => props.onSelect(emoji.native)}
      />
    </div>
  );
}

export default EmojiPicker;
