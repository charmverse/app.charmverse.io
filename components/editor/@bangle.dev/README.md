# Changes

This folder was created to customize packages under the [@bangle.dev](https://github.com/bangle-io/bangle.dev) monorepo to meet our use cases. We are aware that all `@bangle.dev` packages are available as npm packages. Below we have provided the reasons for each specific package.

## `react-menu`

1. `MenuGroup` and `Menu` components were copied over to met our design guidelines (using styled components rather than plain css)
2. `Icon` component was copied over to utilize MUI's own tooltip component rather than the one `react-menu` provides out of the box
3. `MenuButtons` had to be copied as it relied on the `Icon` component. Since we added our own version of `Icon` we had to make use of our own custom `MenuButtons` component
4. Some of the functionalities provided by `MenuButtons` does not suit our use cases
