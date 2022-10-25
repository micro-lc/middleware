# servo

from Australian slang, `servo`, which stands for service station 😌,
is a server implementing parsing and acl utils for json configuration files.

## how to install and run

To run locally this microservice, `node` `16+` is required.

```shell
yarn install
yarn start
```

The microservice will be served by default on port 3000 and will receive
environment variables from `.env.local` file. To override this behaviour, checkout
the official [documentation](https://github.com/mia-platform/lc39) of the `lc39` cli.

## build a docker container

Alternatively a docker container `Dockerfile` is available

```shell
docker build --tag <TAG_NAME> .
docker run -d --port <HOST_PORT>:3000 <TAG_NAME>
```
