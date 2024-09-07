import { Head } from '@react-email/head';
import { Html } from '@react-email/html';
import { Preview } from '@react-email/preview';
import { Section } from '@react-email/section';
import { lightGreyColor } from '@root/theme/colors';
import React from 'react';

import Footer from './Footer';
import Header from './Header';

interface Props {
  children: React.ReactNode;
  preview?: string;
  title: string;
  emailBranding?: {
    artwork: string;
    color: string;
  };
  hideFooter?: boolean;
}

export default function EmailWrapper(props: Props) {
  return (
    <Html>
      <Head>
        {props.preview && <Preview>{props.preview}</Preview>}
        <title>{props.title}</title>
      </Head>
      <Section
        style={{
          backgroundColor: lightGreyColor
        }}
      >
        <Section
          style={{
            width: 600,
            backgroundColor: '#fff',
            padding: 30
          }}
        >
          <Header image={props.emailBranding?.artwork} />
          {props.children}
        </Section>
        {!props.hideFooter && <Footer />}
      </Section>
    </Html>
  );
}
