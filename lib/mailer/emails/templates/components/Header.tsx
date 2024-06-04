import { Img } from '@react-email/img';

import Link from './Link';

const dimensions = {
  medium: {
    height: '46px',
    width: '243px'
  },
  small: {
    height: '36px',
    width: '190px'
  }
};

const domain = process.env.DOMAIN;
const logoImagePath = '/images/charmverse_logo_sm_black.png';

export default function Header({ image, size = 'medium' }: { image?: string; size?: 'medium' | 'small' }) {
  return (
    <Link href={domain}>
      <Img
        src={image || `${domain}${logoImagePath}`}
        style={{
          objectFit: 'cover',
          width: dimensions[size].width,
          height: dimensions[size].height
        }}
      />
    </Link>
  );
}
