import { Options } from './ProductionStack';

const charmverseCert = 'arn:aws:acm:us-east-1:310849459438:certificate/b960ff5c-ed3e-4e65-b2c4-ecc64e696902';
const scoutgameCert = 'arn:aws:acm:us-east-1:310849459438:certificate/b901f27e-5a33-4dea-b4fb-39308a580423';
const sunnyCert = 'arn:aws:acm:us-east-1:310849459438:certificate/4618b240-08da-4d91-98c1-ac12362be229';

export const apps: { [key: string]: { stg?: Options; prd?: Options } } = {
  ceramic: {
    prd: {
      healthCheck: {
        path: '/graphql',
        port: 5001
      },
      instanceType: 't2.micro',
      sslCert: charmverseCert
    },
    stg: {
      healthCheck: {
        path: '/graphql',
        port: 5001
      },
      instanceType: 't2.micro'
    }
  },
  cron: {
    prd: {
      environmentType: 'SingleInstance',
      instanceType: 'r6i.large'
    },
    stg: {
      environmentType: 'SingleInstance'
    }
  },
  farcaster: {
    prd: {
      sslCert: charmverseCert
    }
  },
  sunnyawards: {
    prd: {
      sslCert: sunnyCert
    }
  },
  webapp: {
    prd: {
      sslCert: charmverseCert,
      instanceType: 'm5.xlarge,m5a.xlarge,t3a.xlarge,t3.xlarge'
    }
  },
  websockets: {
    prd: {
      sslCert: charmverseCert,
      instanceType: 't3.medium'
    }
  }
};
