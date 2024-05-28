import { BigQuery } from '@google-cloud/bigquery';

import { googleOAuthClientId, googleOAuthClientSecret, googleServiceAccountEmail } from 'config/constants';

const parsedCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY as any);

// Initialize a BigQuery client
const bigquery = new BigQuery({
  credentials: parsedCredentials
});

const demoDataset = 'oso_playground';
const prodDataset = 'oso';

const targetDataset = `opensource-observer.${demoDataset}`;

// Define your custom SQL query using sql-template-strings for syntax highlighting
const query = `
SELECT *
FROM '${targetDataset}.collections'
`;

// Function to run the query
async function runQuery() {
  try {
    const [job] = await bigquery.createQueryJob({
      query,
      location: 'US' // Location must match that of the dataset(s) referenced in the query.
    });

    console.log(`Job ${job.id} started.`);

    // Wait for the query to finish
    const [rows] = await job.getQueryResults();

    console.log('Query Results:');
    rows.forEach((row) => console.log(row));
  } catch (error) {
    console.error('Error running query:', error);
  }
}

console.log(
  JSON.stringify({
    type: 'service_account',
    project_id: 'charmverse-6827a',
    private_key_id: '21fdb7b2caf0ad28c364e6aad48f7451928874a3',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC0I4PyNVZbwObY\n/+T05bYQ+5NqweXYC5TglVjx8gAwN6WaYb+Ce+dDPvHCll6CQtKXbYbgNnQMNkwQ\n9M8XINMz0BBmvi4BD1/x4wof6v8l5VDTy2hDqr4bPrPddgLhtpMEgxHcrg9kDYwv\nf8geM9vZrIAD7KmnTmA0hkngYzyrFjWlbVI0/+YBKfsMnq6r4ibFjC4AlQdL1q/R\ncEil5EcgrflqQM2EjBafr0dn4KN06cesvU5Ijpy/cRVkqHfKRlepHgwBkMVypgQl\nTdIEbRMerWxbZ9fP2B5/KwIroxElrhVrmngpuJVEyRO60CK3syUfeTATpBWF2/qb\nULAw7un9AgMBAAECggEAETnQNUoqbu28ZYXa5BxPU8Jq72uJSiaZXvyJG+HTaMj5\nehDc2mJ00/Zh8gSlFvnC354mpqwuXriWf4yZfRGzgKHl351SEuHgf+YBIto6+em6\n1/X8i3P5Z+uQEZ5mWiU2W9kYzSyL5jpxbF1gypqU7HTVbQqlko0pH/yzddSniYiV\n7KjVXeExyihTh0HjSq9aEwgtw4FbuK8xQ4jPxqWnyQQO/BZ0eqxKLPcjomB0YWbs\n7E85I2txifCmZCE/a6dfRUarez71M8s1ZorIN0Csheym0FTw8eszpswdD1z6G64q\nlCcs1A/vazx8qsYopbfYxKT0zwy3bYzlUbyQZgTJ4QKBgQDrSfPO0V60l+BbY8fq\n7wGpDRH8jzaRuQK2n0AQq1O0kz+9Xd2cahbWClayiVYHnjrbbIfJwKmsqY3G5pPI\nh2GX/DPh796V+qr6EG9twJtyOA/JHC/YNM1RMEkvXZ35QSkXOU6smmz3jH8/9JUg\nn8W5NCUxGwmePfTcrGF+xZB4lQKBgQDD/sxlAmLpdkXWaf8PXdYLKiZBy5llHBV0\n0OIaWDav7622ti2oF0f/dbdTklrI3CUA85yFMvIXxmNlLDGK0/9NuK5+d2RPIv+G\nWqGT2jqejEqvLO2u2mSQhmfF1hDMNrI+MZIjQKvBNecO/pvs5d4K4hERJgv3Kvfz\nten/7XcJyQKBgAzOXp3AGYZ8ybJPsP7heVapJnR3mwG9bx9fdY4ytQCcDxkQddJg\nl9OYhnV7MhqCCzQMKSva96E1LUlJHXwJmk86Y9yFQLkrBolLwbTYid1incFVbmk3\nHoGvvhv83W9Gk6T28ohEc2/Zzsc9WayH5awZ4XhVv2VEfAJSw4+x0xYtAoGARg1M\nAM5ZjBg53ekEwPlJB7SI9/tNWFYxVQ9TwRbGdRu1exiiOPIZSbVJURV+XUxR7YUk\n7HbJELZX0FF7Y6NiHOVleM4zjBV2Pw8lsTLOwNxj1Ti5u0VTrFRdwthAKL1j99a/\n5Nm4idY6P6HBGWsPcdRbRUXUAQPam8DpYg/9/AECgYEA5HkYvBHxWlN9AIxMR34g\n+BCI611ncBcS85lao6eEDYuiMAzBrTtedBfeH8JmfSZtggS1SK4+Te4pVB/06Mph\nK6wZnfVVU47QcFhn8skEzfYxtwNbAGgeEsxATaRtTLEY2WI5I7KWCGkGOvC4+Oct\nWgb5PSH7MLTXxO/QfTK3YK0=\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk-gevbv@charmverse-6827a.iam.gserviceaccount.com',
    client_id: '106653489472896859548',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-gevbv%40charmverse-6827a.iam.gserviceaccount.com',
    universe_domain: 'googleapis.com'
  })
);

// Execute the function
runQuery().then(() => console.log('Query completed.'));
