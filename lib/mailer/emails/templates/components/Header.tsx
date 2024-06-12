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

export default function Header({ image }: { image?: string }) {
  return (
    <Link href={domain}>
      <Img
        src={image || `${domain}${logoImagePath}`}
        style={
          image
            ? {
                maxHeight: dimensions.medium.height
              }
            : {
                width: dimensions.medium.width,
                height: dimensions.medium.height
              }
        }
      />
    </Link>
  );
}
