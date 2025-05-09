import { Column } from '@react-email/column';
import { Container } from '@react-email/container';
import { Img } from '@react-email/img';
import { Row } from '@react-email/row';
import { charmverseDiscordInvite } from '@packages/config/constants';

import Link from './Link';
import Text from './Text';

const domain = process.env.DOMAIN;
const chatIconPath = '/images/icons/speech-bubbles.png';

export default function Feedback({ primaryColor }: { primaryColor?: string }) {
  return (
    <Container
      style={{
        marginTop: 20
      }}
    >
      <Column width='64'>
        <Img
          style={{
            marginRight: 28,
            paddingRight: 0,
            height: '47px',
            width: '64px'
          }}
          src={`${domain}/${chatIconPath}`}
        />
      </Column>
      <Column>
        <Text>
          <Row>
            <strong>Do you have any feedback on this email?</strong>
          </Row>
          <Row>
            Please share it with us on{' '}
            <Link primaryColor={primaryColor} href={charmverseDiscordInvite}>
              Discord
            </Link>
          </Row>
        </Text>
      </Column>
    </Container>
  );
}
