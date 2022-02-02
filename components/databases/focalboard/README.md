# Changes

This folder was created to customize packages under the [focalboard](https://github.com/mattermost/focalboard) monorepo to meet our use cases. Below is a list of changes we made to the library to work for our repo.

1. Replaced `react-router-dom` with `next/router`
2. Removed telemetry code for tracking events
3. Minor changes to make Typescript types compatible with Next.js tsconfig
4. Minor changes for SSR (checking for window, etc)
5. Moved 3rd party global CSS imports to \_app.tsx and converted local CSS to modules
