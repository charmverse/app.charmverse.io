# app.charmverse.io

The all-in-one Workspace for DAOs

## Contributing

There are several ways you can contribute:

- Tweet us: [@charmverse](https://twitter.com/charmverse)
- Email us: [hello@charmverse.io](mailto:hello@charmverse.io)
- Join Discord: [Charmverse.io](https://discord.gg/ACYCzBGC2M)
- Pull Requests are welcome! See developer setup below 🙌

## Developer Docs

### Developer setup

1. This application requires a PostgreSQL database while we figure out decentralized storage:

If you don't have a local Postgres server running, you can install and run it with Docker:
```
docker run -d -v $HOME/postgresql/data:/var/lib/postgresql/data -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
```
The connection string can be overidden by copying the `.env` file and renaming to `.env.local`:
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

You'll need certain environment variables to be set for Charmverse to work.

See [.env.example](https://github.com/charmverse/app.charmverse.io/blob/main/.env.example) for the full list of variables.

You can also easily switch environments using dotenv.

To do so, create a file in the root directory ie. '.env.myenv'

Start the app from the dotenv CLI, which you can download [here](https://www.npmjs.com/package/dotenv-cli).

```
$ dotenv -e .env.myenv -- npm start
```

For further information about environment variables in Next.js, see the [docs](https://nextjs.org/docs/basic-features/environment-variables).

4. (Optional) Configure S3 for image uploads.

Until we have a decentralized solution, we currently use s3 to store images. You will need to add the following to your `.env.local` file:
S3_UPLOAD_KEY=???
S3_UPLOAD_SECRET=???
S3_UPLOAD_BUCKET=charm.public.test
S3_UPLOAD_REGION=us-east-1

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

# Generate just the Typescript types from updated schema.prisma (you can import the interfaces from "@prisma/client")
npx prisma generate

# Format the schema file
npx prisma format

# Generate a new migration
npx prisma migrate dev --name blocks_title_required
```

For more information about how migrations work: https://www.prisma.io/docs/concepts/components/prisma-migrate.

#### Postgres CLI Cheatsheat

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

### Testing
Testing for client-side and server-side code happens separately.

**Server-side testing**
Our server contains 2 types of tests:
- Unit tests: Covering the functionality of individual components
- Integration tests: Covering the expected responses from API endpoints

We use Jest to run these tests.

You can run individual tests, or test the whole system.

Before running tests, configure a .env.test.local file.

Set the following value inside the .env.test.local file
DATABASE_URL=postgres://postgres:postgres@localhost:5432/charmversetest

__Initial setup__

We've provided a script you can use to configure a test database that won't interfere with your usual local development database.

```bash
# Make database setup script executable
$ chmod +x ./scripts/configure-db.sh

# Run this script to create the test database in your local postgres instance
# Re-run this script at any time to drop and recreate the database with the latest prisma migrations applied
$ npm run test:setup-db

```

__Run tests__
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

__Info for running individual tests__
If you are using VSCode, install the (Jest Runner plugin)[https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner]

In .vscode/settings.json, add:
- for running server side tests: "jestrunner.configPath": "jest.config-server.ts"
- for running client side tests: "jestrunner.configPath": "jest.config-browser.ts"

This will display a small "Run" button above each test suite and assertion.

You can then run the individual tests.

This will also work for the API integration tests, but you must make sure your server is up and running.



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
