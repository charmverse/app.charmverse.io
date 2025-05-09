import { useTheme } from '@emotion/react';
import { charmverseDiscordInvite, isProdEnv } from '@packages/config/constants';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import dynamic from 'next/dynamic';
import { createSwaggerSpec } from 'next-swagger-doc';
import { useEffect } from 'react';

import { useColorMode } from 'hooks/useDarkMode';

import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false
});

const postmanCollectionUrl = `https://github.com/charmverse/app.charmverse.io/blob/464b385ac468c76552ac993eede40c3b52fcfe96/lib/public-api/CharmVerse%20API%20v1.postman_collection.json`;

export const getStaticProps: GetStaticProps = async () => {
  // See this site for official OAS format https://swagger.io/docs/specification/basic-structure/
  const spec: Record<string, any> = createSwaggerSpec({
    apiFolder: 'pages/api/v1',
    schemaFolders: ['lib/public-api'],
    definition: {
      openapi: '3.0.0',
      servers: [
        { url: `${isProdEnv ? 'https://app.charmverse.io' : process.env.DOMAIN}/api/v1`, description: 'Production' }
      ],
      info: {
        title: 'CharmVerse API',
        description: `The CharmVerse public API requires an API key linked to your space, or a partner API key allowing access to multiple spaces. You can request this on our [Discord server](${charmverseDiscordInvite})\r\n\r\nYour API key should be passed in the request headers as **Authorization: "Bearer <your-api-key>"**.\r\nYou can make requests related to cards or databases using the UUID id or the page path ie. "page-022345334" which is visible in the URL when the card or database is open as a full page.\r\n\r\nWe provide a [Postman collection](${postmanCollectionUrl}) for you test out requests while build your integration. Make sure the target database you make requests against contains the properties you wish to use as custom properties in your request. You will need to setup Postman with an API_KEY and API_URL environment variable.\r\nThe API_URL can be taken from the servers list in this documentation. The API_KEY will be the one you receive after requesting it from us.\r\n\r\n⚠️ If you are using a multi-space partner API key, any requests to API endpoints in the Space API category should also contain the spaceId you wish to make the request for as part of the query.\r\nExample:**"/api/v1/endpoint?spaceId=fc59c720-40de-bc1a-8b2b-00538f02953c"**
        `,
        version: '1.1.0',
        contact: 'hello@charmverse.io',
        host: 'app.charmverse.io',
        baseUrl: 'v1'
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        {
          BearerAuth: []
        }
      ]
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
