import type { User } from '@charmverse/core/prisma';
import { Column } from '@react-email/column';
import { Hr } from '@react-email/hr';
import { Row } from '@react-email/row';
import { Section } from '@react-email/section';
import { baseUrl } from '@packages/config/constants';
import { getFormattedDateTime } from '@packages/lib/utils/dates';

import { Avatar, Button, EmailWrapper, Feedback, Text } from './components';

export function OrangeDAOInviteTemplate({
  pagePath,
  pageTitle,
  spaceDomain,
  user,
  spaceName
}: {
  spaceName: string;
  pageTitle: string;
  pagePath: string;
  spaceDomain: string;
  user: Pick<User, 'username' | 'id' | 'avatar'>;
}) {
  const dateTime = getFormattedDateTime(new Date(), {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const link = `${baseUrl}/${spaceDomain}/${pagePath}`;
  return (
    <EmailWrapper title='OrangeDAO fellowship invites you' preview='OrangeDAO fellowship invites you'>
      <Section
        style={{
          margin: '18px 0'
        }}
      >
        <Row>
          <Column style={{ width: 50, verticalAlign: 'top', paddingTop: 10 }}>
            <Avatar name={user.username} avatar={user.avatar} />
          </Column>
          <Column>
            <Text
              style={{
                margin: `6px 0px`
              }}
            >
              <span>
                Are you interested in Grants & Fellowships? You can apply for an Orange DAO Fellowship in one click with
                your CharmVerse profile.
              </span>
            </Text>
            <Text
              variant='caption'
              style={{
                margin: `6px 0px`
              }}
            >
              {dateTime}
            </Text>
            <Text
              variant='subtitle1'
              style={{
                margin: `6px 0px`
              }}
            >
              {spaceName}
            </Text>
            <Text
              bold
              style={{
                margin: `6px 0px`
              }}
            >
              {pageTitle}
            </Text>
          </Column>
        </Row>

        <Row
          style={{
            margin: '6px auto'
          }}
        >
          <Column style={{ width: 50 }} />
          <Button href={link}>Apply</Button>
          <Column style={{ width: 50 }} />
        </Row>
        <Row>
          <Column>
            <Text
              style={{
                margin: `6px 0px`
              }}
              variant='caption'
            >
              <span>What is the OrangeDAO Fellowship?</span>
            </Text>
            <Text
              style={{
                margin: `6px 0px`
              }}
              variant='caption'
            >
              <span>
                A 10 to 12-week program designed to support and accelerate early-stage Web3 startups. It includes
                intensive sprints, mentorship, fundraising support, and culminates in a Demo Day for pitching to
                investors. Startups can receive a $100,000 uncapped investment through a SAFE.
              </span>
            </Text>
          </Column>
        </Row>
      </Section>
      <Hr />
      <Feedback />
    </EmailWrapper>
  );
}
