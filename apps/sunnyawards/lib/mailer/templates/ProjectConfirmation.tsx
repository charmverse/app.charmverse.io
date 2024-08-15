import type { Project } from '@charmverse/core/prisma-client';
import { Head } from '@react-email/head';
import { Html } from '@react-email/html';
import { Img } from '@react-email/img';
import { Section } from '@react-email/section';
import { baseUrl } from '@root/config/constants';
import { Link, Text } from '@root/lib/mailer/emails/templates/components';
import React from 'react';

import { lightGreyColor } from 'theme/colors';

const sunnysColor = '#d8be7d';

function ProjectField({ label, value }: { label: string; value: string | number }) {
  return (
    <>
      <Text
        variant='subtitle1'
        style={{
          lineHeight: 0.5
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          lineHeight: 1,
          marginBottom: 30
        }}
      >
        {value}
      </Text>
    </>
  );
}

export function ProjectConfirmation({
  project
}: {
  project: Project & {
    projectMemberUsernames: string[];
  };
}) {
  const projectType = project.sunnyAwardsProjectType;
  return (
    <Html>
      <Head>
        <title>Congratulations you just entered the Sunnys</title>
      </Head>
      <Section
        style={{
          backgroundColor: lightGreyColor
        }}
      >
        <Section
          style={{
            width: 600,
            backgroundColor: '#fff'
          }}
        >
          <Img
            src={`${baseUrl}/images/sunnys-landscape.png`}
            style={{
              maxHeight: '100px',
              width: '100%'
            }}
          />
          <Section
            style={{
              padding: 30
            }}
          >
            <Text>
              Congratulations you just entered the Sunnys, a celebration of everything you have accomplished on the
              Superchain. Learn more about the Sunnys{' '}
              <Link primaryColor={sunnysColor} href='https://www.thesunnyawards.fun/'>
                here
              </Link>
              .
            </Text>

            <Text>
              You can still change your entry{' '}
              <Link primaryColor={sunnysColor} href={`${baseUrl}/p/${project.path}/edit`}>
                here
              </Link>
              .
            </Text>

            <Text>The details of your application:</Text>

            <ProjectField label='Name' value={project.name} />
            <ProjectField label='Description' value={project.description || 'N/A'} />
            {projectType === 'creator' ? (
              <ProjectField label='Minting wallet address' value={project.mintingWalletAddress || 'N/A'} />
            ) : projectType === 'app' ? (
              <>
                <ProjectField label='Chain ID' value={project.primaryContractChainId || 'N/A'} />
                <ProjectField label='Contract Address' value={project.primaryContractAddress || 'N/A'} />
                <ProjectField label='Deployer Address' value={project.primaryContractDeployer || 'N/A'} />
                <ProjectField
                  label='Deployment Transaction Hash'
                  value={project.primaryContractDeployTxHash || 'N/A'}
                />
              </>
            ) : null}
            <ProjectField label='Websites' value={project.websites.join(', ') || 'N/A'} />
            <ProjectField label='Category' value={project.category || 'N/A'} />
            <ProjectField label='Farcaster profiles' value={project.farcasterValues.join(', ') || 'N/A'} />
            <ProjectField label='X' value={project.twitter || 'N/A'} />
            <ProjectField label='Github' value={project.github || 'N/A'} />

            <hr />
            <Text variant='h3'>Project Members</Text>
            {project.projectMemberUsernames.map((username) => (
              <Text
                key={username}
                style={{
                  lineHeight: 1
                }}
              >
                <Link primaryColor={sunnysColor} href={`https://warpcast.com/${username}`}>
                  {username}
                </Link>
              </Text>
            ))}
          </Section>
        </Section>
      </Section>
    </Html>
  );
}
