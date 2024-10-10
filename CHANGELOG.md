# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## [3.3.2-rc.0] - 2024-10-10

### Added

- Exposes route to parse incoming configuration

## [3.2.2] - 2024-06-10

### Fixed

- Fixed exported types

## [3.2.1] - 2024-06-10

### Added

- Exported function for language evaluation

## [3.2.0] - 2024-05-31

### Added

- Support for user-defined custom function to generalize ACL context extraction

## [3.1.1] - 2024-04-05

### Fixed

- Symbolic links in language directory cause service crash

## [3.1.0] - 2024-03-22

### Added

- Languange resolution via Content Negotiation

## [3.0.6] - 2023-12-14

### Versioning

- Development dependencies updated

### Changed

- Improved error handling on unsupported ACL expressions

## [3.0.5] - 2023-10-02

### Versioning

- `glob` bumped to `^10.3.10`
- `mkdirp` bumped to `^3.0.1`
- `@fastify/static` bumped to `^6.11.2`
- `@mia-platform/lc39` bumped to `^7.0.1`
- `@micro-lc/interfaces` bumped to `^1.1.0`
- `@micro-lc/layout` bumped to `^2.2.0`
- `fastify` bumped to `^4.23.2`
- Development dependencies updated

### Fixed

- CLI will not add `undefined` to style attributes if input not had no style attribute

## [3.0.4] - 2023-06-04

### Versioning

- `@mia-platform/lc39` bumped to `v7.0.0`
- `@mia-platform/custom-plugin-lib` bumped to `v6.0.0`
- `@fastify/static` bumped to `v6.x`
- Development dependencies updated

### Fixed

- CLI will not break if menu icon selector has an unexpected value

## [3.0.3] - 2023-04-13

### Fixed

- fix to CVE-2023-0464 in Dockerfile
- fix to CVE-2023-0465 in Dockerfile
- fix to CVE-2023-0466 in Dockerfile

### Versioning

- Development dependencies updated
- `typescript` to `^5.0.2`
- `typescript` to `^5.0.4`

## [3.0.2] - 2023-03-03

### Fixed

- `sdk` folder included into published package

## [3.0.1] - 2023-03-03

### Changed

- changed package manager from Yarn to NPM

## [3.0.0] - 2023-03-01

### Added

- `public` folder is served as a static webserver root folder
- user can configure mime-type per extension
- user can configure headers per resource

### Versioning

- Development dependencies updated

### BREAKING CHANGES

- configurations are served from a fixed endpoint `/configurations`
- variable `RESOURCES_DIRECTORY_PATH` defaults to `/usr/static/public`

## [2.0.4] - 2023-02-17

### Fixed

- cli fix: from `busDiscriminator` to `eventBus` pool even when other properties are declared
- headers: use `/public/index.html` headers when 200 and url is `/public` or `/public/`

### Versioning

- Development dependencies updated

## [2.0.3] - 2023-02-09

### Fixed

- security vulnerability to `http-cache-semantics` solved bumping from 4.1.0 to 4.1.1

### Versioning

- Development dependencies updated
- `@apidevtools/json-schema-ref-parser` version bumped to `^10.1.0`

## [2.0.2] - 2023-01-24

### Fixed

- Security update on `json5` >= 2.2.2. `ts-mocha` has been removed and `eslint-plugin-import` has been fixed with a successful resolution in `package.json`

### Versioning

- Development dependencies updated
- `fastify` version bumped to `^4.12.0`
- `@apidevtools/json-schema-ref-parser` version bumped to `^10.0.1`

## [2.0.1] - 2023-01-17

### Added

- `middleware` can serve any type of static file (only yaml and JSON will undergo acl validation and $ref resolution)
- `Content-Type` can be configured on a per-extension basis
- CLI tests

### Versioning

- Development dependencies updated
- `fastify` version bumped to `^4.11.0`
- `ajv` version bumped to `^8.12.0`
- `@mia-platform/custom-plugin-lib` version bumped to `^5.1.5`
- `@apidevtools/json-schema-ref-parser` version bumped to `^9.1.0`

## [2.0.0]
