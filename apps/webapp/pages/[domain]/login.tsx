import type { GetServerSideProps } from 'next';

import { LoginPageView } from 'components/login/LoginPage';

export const getServerSideProps: GetServerSideProps<any> = async (context) => {
  const returnUrl = typeof context.query.returnUrl === 'string' ? context.query.returnUrl : undefined;
  if (returnUrl) {
    let destination = returnUrl.split('?')[0];
    // append existing query params but remove returnUrl
    Object.keys(context.query).forEach((key) => {
      if (key !== 'returnUrl') {
        destination += `${destination.includes('?') ? '&' : '?'}${key}=${context.query[key]}`;
      }
    });
    return {
      redirect: {
        destination,
        permanent: false
      }
    };
  }
  return {
    props: {}
  };
};

export default function LoginPage() {
  return <LoginPageView />;
}
