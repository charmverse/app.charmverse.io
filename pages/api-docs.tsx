import { useTheme } from '@emotion/react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import dynamic from 'next/dynamic';
import { createSwaggerSpec } from 'next-swagger-doc';
import { useEffect } from 'react';

import { charmverseDiscordInvite } from 'config/constants';
import { useColorMode } from 'context/darkMode';

import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false
});

export const getStaticProps: GetStaticProps = async () => {
  // See this site for official OAS format https://swagger.io/docs/specification/basic-structure/
  const spec: Record<string, any> = createSwaggerSpec({
    apiFolder: 'pages/api/v1',
    schemaFolders: ['lib/public-api'],
    definition: {
      openapi: '3.0.0',
      servers: [{ url: 'https://app.charmverse.io/api/v1', description: 'Production' }],
      info: {
        title: 'Charmverse API',
        description: `The Charmverse public API requires an API key linked to your space, or a partner API key allowing access to multiple spaces. You can request this on our [Discord server](${charmverseDiscordInvite}).\r\n\r\nYour API key can be passed in the request headers as **Authorization: "Bearer <your-api-key>"** or as part of your request ie. **"/api/v1/endpoint?api_key=abcdef-123456"**.\r\n\r\n⚠️ If you are using a multi-space partner API key, any requests to API endpoints in the default group should also contain the spaceId you wish to make the request for as part of the query.\r\nExample:**"/api/v1/endpoint?api_key=abcdef-123456&spaceId=fc59c720-40de-bc1a-8b2b-00538f02953c"**`,
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

// https://spec.openapis.org/oas/latest.html
export default function ApiDoc({ spec }: InferGetStaticPropsType<typeof getStaticProps>) {
  const theme = useTheme();
  const colorMode = useColorMode();

  useEffect(() => {
    if (theme.palette.mode === 'dark') {
      colorMode.toggleColorMode();
    }
  }, [theme.palette.mode]);

  return <SwaggerUI spec={spec}></SwaggerUI>;
  //  ;
}
