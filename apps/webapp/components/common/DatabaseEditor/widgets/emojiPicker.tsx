import data from '@emoji-mart/data';
import dynamic from 'next/dynamic';

// import 'emoji-mart/css/emoji-mart.css';

const Picker = dynamic(() => import('@emoji-mart/react'), { ssr: false });

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
      <Picker data={data} onSelect={(emoji: { native: string }) => props.onSelect(emoji.native)} />
    </div>
  );
}

export default EmojiPicker;
