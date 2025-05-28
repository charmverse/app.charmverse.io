import type { BaseEmoji } from 'emoji-mart';
import dynamic from 'next/dynamic';

// import 'emoji-mart/css/emoji-mart.css';

const Picker = dynamic(() => import('emoji-mart').then((r) => r.Picker), { ssr: false });

type Props = {
  onSelect: (emoji: string) => void;
};

function EmojiPicker(props: Props): JSX.Element {
  return (
    <div
      className='EmojiPicker'
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <Picker onSelect={(emoji: BaseEmoji) => props.onSelect(emoji.native)} />
    </div>
  );
}

export default EmojiPicker;
