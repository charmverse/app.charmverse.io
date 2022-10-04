import { useTheme } from '@emotion/react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { createSwaggerSpec } from 'next-swagger-doc';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

import { useColorMode } from 'context/darkMode';

import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false
});

export const getStaticProps: GetStaticProps = async () => {
  const spec: Record<string, any> = createSwaggerSpec({
    apiFolder: 'pages/api/v1',
    schemaFolders: ['lib/public-api'],
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Charmverse API',
        description: 'The Charmverse public API requires an API key. You can request this on our [Discord server](https://discord.gg/ACYCzBGC2M).\r\n\r\nYour API key can be passed in the **query url as api_key=<your-api-key>** or the **request headers as Authorization: "Bearer <your-api-key>"**.\r\n\r\n**Base path: https://app.charmverse.io/api/v1/**',
        version: '1.0.0',
        contact: 'hello@charmverse.io',
        host: 'app.charmverse.io',
        baseUrl: 'v1'
      }
    }
  });

  // console.log('API Spec', spec);

  return {
    props: {
      spec
    }
  };
};

export default function ApiDoc ({ spec }: InferGetStaticPropsType<typeof getStaticProps>) {

  const theme = useTheme();
  const colorMode = useColorMode();

  useEffect(() => {
    if (theme.palette.mode === 'dark') {
      colorMode.toggleColorMode();
    }

  }, []);

  return (
    <SwaggerUI spec={spec}>
    </SwaggerUI>
  );
//  ;
}

