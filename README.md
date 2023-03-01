<h1 align="center">⛽ Middleware</h1>

`Middleware` is a backend service responsible for serving
[micro-lc](https://github.com/micro-lc/micro-lc) configuration files, applying some useful parsing logic before
returning their content. This logic is also distributed through an SDK to ease the process of building custom
configurations serves.

On top of that, this service distributes a CLI that can be used to automatically convert micro-lc configuration files from
one version to another.

For a detailed description of the service capabilities, referer to the 
[server](https://micro-lc.io/add-ons/backend/middleware) and 
[CLI](https://micro-lc.io/docs/migrating-from-v1#automated-migration) official documentation.

---

## Local development

To develop locally you need:

- Node 18+
- Yarn 1.22+

To set up Node, please if possible try to use [nvm](https://github.com/creationix/nvm), so you can manage multiple
versions easily. Once you have installed nvm, you can go inside the directory of the project and simply run
`nvm install`, the `.nvmrc` file will install and select the correct version if you don’t already have it.

Yarn can be installed globally running `corepack enable` since node 16.

Once you have all the dependency in place, you can launch:

```shell
yarn
yarn coverage
```

This two commands, will install the dependencies and run tests emitting a coverage report.

To launch the service locally, ensure you don't have a `.env.local` file in your root folder and run:

```shell
./scripts/set-default.env.sh
```

From now on, if you want to change anyone of the default values for the variables you can do it inside the `.env.local`
file without pushing it to the remote repository.

Once you have all your dependency in place you can launch:

```shell
yarn build
yarn start:local
```

and you will have the service exposed on your machine. In order to verify that the service is working properly you could
launch in another terminal shell:

```shell
curl http://localhost:3001/-/ready
```

As a result the terminal should return you the following message:

```json
{"name":"@micro-lc/middleware","status":"OK","version":"0.2.1"}
```

## Build a Docker container

The service Docker image can be build through provided [Dockerfile](./Dockerfile), running

```shell
docker build --tag microlc/middleware .
```

To start the container, you can use the [run.sh](./scripts/run.sh) script, running:

```shell
.scripts/run.sh
```

## Tag

```shell
yarn bump [patch|minor|major|<version number>]
```

releases both the sdk on npm and the docker container on docker hub
