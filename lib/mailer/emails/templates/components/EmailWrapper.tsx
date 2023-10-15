import { Head } from '@react-email/head';
import { Html } from '@react-email/html';
import { Preview } from '@react-email/preview';
import { Section } from '@react-email/section';
import React from 'react';

import { lightGreyColor } from 'theme/colors';

import Footer from './Footer';
import Header from './Header';

interface Props {
  children: React.ReactNode;
  preview?: string;
  title: string;
  headerSize?: 'medium' | 'small';
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
          <Header size={props.headerSize} />
          {props.children}
        </Section>
        <Footer />
      </Section>
    </Html>
  );
}
