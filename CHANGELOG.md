# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

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
