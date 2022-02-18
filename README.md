# app.charmverse.io

The all-in-one Workspace for DAOs

## Contributing

There are several ways you can contribute:

- Tweet us: [@charmverse](https://twitter.com/charmverse)
- Email us: [hello@charmverse.io](mailto:hello@charmverse.io)
- Join Discord: [Charmverse.io](https://discord.gg/UEsngsk8E2)
- Pull Requests are welcome! See developer setup below 🙌

## Developer Docs

### Developer setup

1. This application requires a PostgreSQL database while we figure out decentralized storage. The connection string can be overidden by copying the `.env` file and renaming to `.env.local`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/charmverse
```

2. Download and install this repo to get started:

1. Clone this repo
2. Run `npm ci`
3. Run `npm start` and visit [http://localhost:3000](http://localhost:3000)
4. Run `npx prisma migrate dev` to create tables (you may have to create a "charmverse" database first).

### Third Party Dependencies

CharmVerse is a React app built using:

- Ethers.js
- Material UI
- Next.js
- React
- Typescript
- Prisma
- @bangle.dev / Prosemirror
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
