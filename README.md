# app.charmverse.io

The all-in-one Space for DAOs

## Contributing

There are several ways you can contribute:

- Tweet us: [@charmverse](https://x.com/charmverse)
- Email us: [hello@charmverse.io](mailto:hello@charmverse.io)
- Join Discord: [CharmVerse.io](https://discord.gg/ACYCzBGC2M)
- Pull Requests are welcome! See developer setup below 🙌

## Developer Docs

### Developer setup

1. This application requires a PostgreSQL database while we figure out decentralized storage:

If you don't have a local Postgres server running, you can install and run it with Docker:

```
docker run -d -v $HOME/postgresql/data:/var/lib/postgresql/data -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
```

The connection string can be overridden by copying the `.env` file and renaming to `.env.local`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/charmverse
```

[Tip] We use Prisma to talk to the database, see some [examples and documentation](https://www.prisma.io/docs/concepts/components/prisma-client/crud).

2. Download and install this repo to get started:

```
git clone git@github.com:charmverse/app.charmverse.io.git
npm ci
npx prisma migrate dev
npm start
```

3. Configure your environment.

Copy [.env.example](https://github.com/charmverse/app.charmverse.io/blob/main/.env.example) to .env, and add the required secrets as well as any extra ones for features you wish to enable.

```bash
# Setup the .env file
$ cp .env.example .env
```

4. Start the app.

```bash
# By default, Next.JS will search for the values
$ npm start
```

You can also easily switch environments using dotenv.

To do so, create a file in the root directory ie. '.env.myenv'

Start the app from the dotenv CLI, which you can download [here](https://www.npmjs.com/package/dotenv-cli).

For further information about environment variables in Next.js, see the [docs](https://nextjs.org/docs/basic-features/environment-variables).

### Useful Plugins

Chrome / Prosemirror Dev Tools
[Prosemirror Dev Tools](https://chrome.google.com/webstore/detail/prosemirror-developer-too/gkgbmhfgcpfnogoeclbaiencdjkefonj)

Get access to the document structure of all our editor content

Chrome / SWR DevTools
[SWR DevTools](https://chrome.google.com/webstore/detail/swr-devtools/liidbicegefhheghhjbomajjaehnjned)

Inspect SWR cache data and results

### Access your local server via https

You may want to access your local development server using https from another device (such as in the case of mobile testing).

**Steps**

1. Run the following command in your terminal to generate the certificate

openssl req -x509 -out localhost.crt -keyout localhost.key \
 -days 365 \
 -newkey rsa:2048 -nodes -sha256 \
 -subj '/CN=localhost' -extensions EXT -config <( \
 printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")

2. Create the extra certificates directory

sudo mkdir /usr/local/share/ca-certificates/extra # see https://askubuntu.com/questions/73287/how-do-i-install-a-root-certificate for additional information

> MacOS: You will need to manually create the share and ca-certificate directories first

3. Copy the certificate to the directory

sudo cp localhost.crt /usr/local/share/ca-certificates/extra/localhost.crt

4. Update system certificates

sudo update-ca-certificates

> MacOS: You will need to use the Keychain app to manually add the certificate you created from the ca-certificates folder.

5. Allow unsigned certificates

NODETLSREJECT_UNAUTHORIZED=0 # this needs to be added to the .env file to ignore unsigned certificates on localhost (only include this on the development .env file, not production)

6. Run the startup script

```bash
  # Starts NextJs server on port 8080, and makes it accessible via port 3000
  $  npm run start:ssl
```

7. Access your device

Find your local IP address on the network, and add the port and https prefix. For example

https://192.168.1.2:3000

You can now access your local dev server from another device on your network over HTTPS

### Third Party Dependencies

CharmVerse is built with:

- Typescript
- Next.js
- React
- Material UI
- ethers.js
- Prisma
- @bangle.dev / ProseMirror
- focalboard

### Database

Our connection to PostgreSQL is managed by a Prisma client. Below are the most common commands:

```
# Update your local database
npx prisma migrate dev

# View the contents of the database
npx prisma studio

# Generate just the Typescript types from updated schema.prisma (you can import the interfaces from '@charmverse/core/prisma')
npx prisma generate

# Format the schema file
npx prisma format

# Generate a new migration
npx prisma migrate dev --name blocks_title_required
```

For more information about how migrations work: https://www.prisma.io/docs/concepts/components/prisma-migrate.

#### Postgres CLI Cheatsheet

```
# Connect to Postgres
psql -h <host> -p 5432 -U <user> -d <database>

# View databases
\l

# Enter a database
\c <databasename>

# View tables
\dt

# View columns in a table
\d+ <table>

# View prisma migrations
SELECT started_at,migration_name FROM "_prisma_migrations" ORDER BY "started_at" DESC LIMIT 20;

```

### Get access to AWS resources:

Get on Twingate to use the ZeroTrust network to get access to AWS.

- Download the Twingate client here: https://www.twingate.com/download
- Install client
- When prompted with "Connect to a Network", type in "charmverse.twingate.com"
- Client will then forward you to Google auth page. If asked to grant twingate access to your google account please do so.
- Your Client is now properly configured to connect to resources behind AWS.

To test your connection:

Use your favorite database client and connect to stg postgres at URL hostname

`stg-app-charmverse-io.ckvazun0eddr.us-east-1.rds.amazonaws.com`

or cmdline

`psql -h stg-app-charmverse-io.ckvazun0eddr.us-east-1.rds.amazonaws.com -U charmverse`

For a longer version of this Twingate docs: https://app.charmverse.io/charmverse/page-7001517083591569

### Web Sockets

Real-time features including the content editor for pages rely on a web socket service. It depends on socket.io.

#### Development

```
# Running the standard dev command will serve web sockets as part of the Next.js process:
npm start

# Run as a separate process along with the Next.js app:
npm run sockets

# Run process on its own:
npm run sockets:dev
```

### Testing

Testing for client-side and server-side code happens separately.

**Server-side testing**
Our server contains 2 types of tests:

- Unit tests: Covering the functionality of individual components
- Integration tests: Covering the expected responses from API endpoints

We use Jest to run these tests.

You can run individual tests, or test the whole system.

Before running tests, configure a .env.test.local file.

```bash
  cp .env.test.local.example .env.test.local
```

**Initial setup**

We've provided a script you can use to configure a test database that won't interfere with your usual local development database.

```bash
# Make database setup script executable
$ chmod +x ./scripts/configure-db.sh

# Run this script to create the test database in your local postgres instance
# Re-run this script at any time to drop and recreate the database with the latest prisma migrations applied
$ npm run test:setup-db

```

**Run tests**
Start your server with following command

```bash
# Start the server
$ npm run start:test

# (Optional) Open Prisma Studio to see the test data
$ npm run db-tool:test

# Execute tests
$ npm run test:server

```

**Client-side testing**

On the client side, we have tests written with `react-testing-library`. In order to run them, please go through the following section.

**Info for running individual tests**

If you are using VSCode, install the [Jest Runner plugin](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner)

In .vscode/settings.json, add:

- for running server side tests: "jestrunner.configPath": "jest.config.server.ts"
- for running client side tests: "jestrunner.configPath": "jest.config.browser.ts"

This will display a small "Run" button above each test suite and assertion.

You can then run the individual tests.

This will also work for the API integration tests, but you must make sure your server is up and running.

**E2E testing**

We use `playwright` for end-to-end testing.
To run all tests use `npm run test:e2e`

**Info for running individual e2e in chromium browser**

There is util command that will allow you to run single test in a spawned chromium browser for easier debugging.
Command to use: `npm run debug:e2e __e2e__/YOUR_TEST_FILE.spec.ts`

i.e: `npm run debug:e2e __e2e__/login.spec.ts`

### Theming

- To make it easy to maintain light/dark mode, color choices should be defined on Theme.palette in `theme/index.tsx`. This way, we can use colors from the theme in two ways:

```
// styled component:
const Container = styled(Box)`
  color: ${({ theme }) => theme.palette.sidebar.background};
`;

// 'sx' property from Material UI:
<Box sx={{ bgcolor: 'sidebar.background' }} />
```

# Background Workers (/background folder)

There are several cron tasks managed inside the /background/tasks folder. These run inside their own Beanstalk environment. Visit the folder to see the latest tasks.

## Notifications

To debug notifications, you can run a command to read back current tasks:

```
dotenv -e .env.local -- npm run notifications:debug
```

# Stuff related to running in Elastic Beanstalk

## Adding a new secret to Beanstalk app & environment:

**_Create the secret:_**

Secret names have the following format:
`/io.cv.app/<env>/<secret name>`

Secret names are namespaced by the running environment. If, for example, you are only using this secret when
running the app in production, then namespace is `prd`. In staging environment, the secret namespace is `stg`.
Many secrets are the same regardless of whether you're running the app in production or staging, then the namespace is `shared`.

If you have more than 1 secrets that are from the same vendor, then name the secret after the vendor, and
add each secret as a key:value pair under the vendor secret

```
secret_json="{ \"discord_oauth_client_id\": \"xxxxx\", \"discord_oauth_client_secret\": \"yyyyy\" }"

aws secretsmanager create-secret --name /io.cv.app/shared/discord --secret-string $secret_json

# or create a json file with those secrets
aws secretsmanager create-secret --name /io.cv.app/shared/discord --secret-string file://secret.json

```

**_Add template mustache to pull secrets when deploying:_**

In `.ebextensions/webapp/00_env_vars.config` add the mustache placeholder lines so beanstalk can pull the secret and
set it to the right environment variable.

Format of the mustache placeholder is:

```
{{pull:secretsmanager:<SECRET_NAME>:SecretString:<SECRET_JSON_KEY>}}
```

Following up with the previous example, we want to grab discord_oauth_client_id and set it to
env variable `Discord_oauth_client_id`

```
option_settings:
  aws:elasticbeanstalk:application:environment:
      DISCORD_OAUTH_CLIENT_ID: "{{pull:secretsmanager:/io.cv.app/shared/discord:SecretString:discord_oauth_client_id}}"
      DISCORD_OAUTH_CLIENT_SECRET: "{{pull:secretsmanager:/io.cv.app/shared/discord:SecretString:discord_oauth_client_secret}}"
```

**_NOTE:_**

This template placeholder format mimics that of Cloudformation mustache placeholder to pull secrets from secrets manager:

```
{{resolve:secretsmanager:<SECRET_NAME>:SecretString:<SECRET_JSON_KEY>}}.  # does not work!
```

Currently resolving the Secrets Manager template placeholder is not supported in ElasticBeanstalk. If we
specify template variable using the `{{resolve:secretsmanager}}` format, it will be stripped out entirely
from `.env` file. So we came up with a modified version `{{pull:secretsmanager}}`.
Should/when Secrets Manager template variable placeholder becomes supported in Elastic beanstalk, we can simply do a global replace of `pull` to `resolve` to leverage that support.

## To set up datadog in staging environment

Normally datadog agent is not deployed in the staging environment. To run datadog agent in staging environment edit
`.ebextensions/webapp/00_env_vars.config` and append `,ddtst` to the `COMPOSE_PROFILES` (Note you'll want to separate the profiles with a comma)

## Running storybook

Storybook is used to present base available components to keep a consistent design system across the app.

Start storybook locally:

`npm run storybook`

Build storybook dist:

`npm run storybook:build`
