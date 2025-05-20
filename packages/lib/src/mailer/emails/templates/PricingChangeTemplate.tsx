import { Hr } from '@react-email/hr';
import { Section } from '@react-email/section';
import * as React from 'react';

import { EmailWrapper, Feedback, Link, Text } from './components';

export type PricingChangeEmailProps = {
  // eslint-disable-next-line react/no-unused-prop-types
  spaceName: string;
  adminName: string;
  emailBranding?: {
    artwork: string;
    color: string;
  };
};

export function PricingChangeTemplate({ adminName, emailBranding }: PricingChangeEmailProps) {
  return (
    <EmailWrapper emailBranding={emailBranding} title='Important: CharmVerse Pricing Update'>
      <Section
        style={{
          margin: '18px 0'
        }}
      >
        <Text>Hi {adminName},</Text>
        <Text>We're officially turning on payments for CharmVerse Spaces and you're among the first to take part.</Text>
        <Text>
          To keep your Space active and unlock premium features, you'll now need to select a plan and contribute in $DEV
          tokens. This is a big step toward sustainable, community-owned infrastructure and we're excited to build it
          with you.
        </Text>

        <Text style={{ marginTop: 24 }}>🌐 How the New Pricing Works</Text>

        <Text bold>Community-Based Payments</Text>
        <Text>Each Space now pays monthly in $DEV tokens to stay on a paid tier.</Text>

        <Text bold>Anyone Can Contribute</Text>
        <Text>
          Community members can buy and pledge $DEV to support your Space. It's shared like a Discord server boost.
        </Text>

        <Text bold>The More You Contribute, The More You Unlock</Text>
        <Text>Additional $DEV pledges unlock more advanced features.</Text>

        <Text style={{ marginTop: 24 }}>💡 CharmVerse Pricing Tiers</Text>
        <Text>
          Check out our <Link href='https://charmverse.io/post/community-pricing/'>blog post</Link> to learn more
          details about the tiers.
        </Text>

        <Text style={{ marginTop: 24 }}>What should I do?</Text>
        <Text>
          New pricing plans begin June 1, 2025. You should:
        </Text>
        <Text>• Review your pricing tier.</Text>
        <Text>• Rally your community to contribute.</Text>
        <Text>• Explore what features each tier includes.</Text>
        <Text>
          Need to move off CharmVerse? You'll be able to export and download your Space's content before billing begins in June 2025.
        </Text>

        <Text bold style={{ marginTop: 24 }}>
          🔁 Why We're Doing This
        </Text>
        <Text>This change is about long-term sustainability and decentralized ownership.</Text>
        <Text>• It reflects the way real onchain communities operate.</Text>
        <Text>• It empowers contributors to share the cost.</Text>
        <Text>• It ensures we can keep delivering the tools you rely on.</Text>

        <Text bold style={{ marginTop: 24 }}>
          ✅ What To Do Next
        </Text>
        <Text>• Go to your Space settings to review your tier.</Text>
        <Text>• Invite your community to pledge $DEV.</Text>
        <Text>• Reach out if you need help with anything.</Text>

        <Text style={{ marginTop: 24 }}>
          We're here to support you every step of the way. Let's keep building coordination infrastructure that's
          community-powered and future-proof.
        </Text>
      </Section>
      <Hr />
      <Feedback primaryColor={emailBranding?.color} />
    </EmailWrapper>
  );
}

export function emailPricingChangeSubject({ spaceName }: PricingChangeEmailProps) {
  return `Important: CharmVerse Pricing Update for ${spaceName}`;
}
