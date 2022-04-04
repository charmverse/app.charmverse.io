import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useEffect, useState } from 'react';

import { createSwaggerSpec } from 'next-swagger-doc';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export const getStaticProps: GetStaticProps = async ctx => {
  const spec: Record<string, any> = createSwaggerSpec({
    apiFolder: 'pages/api/v1',
    schemaFolders: ['pages/api/v1/databases'],
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Charmverse API',
        version: '1.0.0',
        contact: 'hello@charmverse.io',
        host: 'app.charmverse.io',
        basePath: 'v1'
      }

    }
  });

  console.log('Spec', spec);

  return {
    props: {
      spec
    }
  };
};

export default function ApiDoc ({ spec }: InferGetStaticPropsType<typeof getStaticProps>) {

  return (<SwaggerUI spec={spec}>s</SwaggerUI>);
//  ;
}

