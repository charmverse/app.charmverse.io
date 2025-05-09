## Overview

Charmverse supports the inheritance of page permissions.
The implementation takes place on two levels, actions and triggers.

Once permissions are assigned and we want to consume them, the server simply adds up all available permissions to a user via their profile, role and space membership and outputs the maximum set of allowable actions.

## Triggers

Triggers are higher level functions corresponding to specific events in the app.

You can use a specific trigger as 1 line of code anywhere in the software after triggering a supported event, and be sure that the permission tree created will be consistent.

Triggers orchestrate multiple actions to deliver the desired outcome, such as when a page is created.

Visit \_\_integration-tests\_\_/permissions and execute various tests to see triggers at play.
To find where these triggers are called, visit the following endpoints:

**Page repositioned**

- pages/api/pages/[id]/index.ts

**Page created**

- pages/api/pages/index.ts

**Permission created**

- pages/api/permissions/index.ts

## Actions

Actions are atomic functions with a specific purpose, such as creating a permission, or performing a check.

The **core function that creates a permission is upsert-permission**. This function ensures that for a page, there is only ever 1 permission per group ie. user, space or role.

It also handles all validation, as well as cascading the new value of an updated permission down to children.

## Documentation

Miro [board](https://miro.com/app/board/uXjVONoZGMM=/) with workflows

Charmverse [page](https://app.charmverse.io/charmverse/page-8955896923578681)
