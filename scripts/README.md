The scripts in this folder can be run as one-offs with ts-node.

You will need to have ts-node and dotenv installed globally.

```
$ npm i -g ts-node dotenv-cli
$ dotenv -e .env.local -- ts-node scripts/<myscript>.ts

```

This repo has been configured to allow you to run ts-node scripts as a one-off.

See this [stackoverflow answer](https://stackoverflow.com/a/70515138) for more details.
