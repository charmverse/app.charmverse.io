import { replaceS3Domain } from '@packages/utils/url';
import { Img } from '@react-email/img';
import { stringToColor } from '@root/lib/utils/strings';

import Text from './Text';

type AvatarSize = 'large' | 'medium' | 'small';

const sizeStyleMap: Record<AvatarSize, React.CSSProperties> = {
  large: {
    height: 54,
    width: 54,
    fontSize: '1.5rem'
  },
  medium: {
    height: 32,
    width: 32,
    fontSize: '1.25rem'
  },
  small: {
    height: 26,
    width: 26,
    fontSize: '1rem !important'
  }
};

export default function Avatar({
  size = 'medium',
  name,
  avatar
}: {
  size?: AvatarSize;
  name?: string;
  avatar: string | null | undefined;
}) {
  const nameStr = (name || '').replace('0x', ''); // ignore the universal prefix of addresses

  return avatar ? (
    <Img
      style={{
        margin: 0,
        backgroundColor: 'initial',
        borderRadius: '50%',
        ...sizeStyleMap[size]
      }}
      src={replaceS3Domain(avatar)}
    />
  ) : (
    <Text
      style={{
        color: 'white',
        margin: 0,
        backgroundColor: stringToColor(nameStr),
        borderRadius: '50%',
        textAlign: 'center',
        ...sizeStyleMap[size]
      }}
    >
      {nameStr.charAt(0).toUpperCase()}
    </Text>
  );
}
