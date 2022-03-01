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

1. This application requires a PostgreSQL database while we figure out decentralized storage. The connection string can be overidden by copying the `.env` file and renaming to `.env.local`:

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
