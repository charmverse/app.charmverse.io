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

Download and install this repo to get started:

1. Clone this repo
2. Run `npm ci`
3. Run `npm start` and visit [http://localhost:3000](http://localhost:3000)

### Best Practices

#### Theming

- To make it easy to maintain light/dark mode, color choices should be defined on Theme.palette in `theme/index.tsx`. This way, we can use colors from the theme in two ways:

```
// styled component:
const Container = styled(Box)`
  color: ${({ theme }) => theme.palette.sidebar.background};
`;

// 'sx' property from Material UI:
<Box sx={{ bgcolor: 'sidebar.background' }} />
```

### Third Party Dependencies

We stand on the shoulders of giants:

- Typescript
- React
- Next.js
- Ethers.js
- Prisma.js
- Bangle.io / bangle.dev
- Material UI
