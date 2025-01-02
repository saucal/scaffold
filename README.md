# SAU/CAL Scaffold

This is meant to be a command to scaffold plugins, themes, projects with the command line.

_This package is inspired by [@wordpress/scripts](https://www.npmjs.com/package/@wordpress/scripts)._

## Installation

To install as a global NPM package:
`npm install -g saucal/scaffold`

## Usage

`sc-scaffold plugin --name="My Plugin Name"`

## Available arguments

- `--branch` (Default: 'master')
- `--name` (Default: '')
- `--slug` (Default: '')
- `--uri` (Default: '')
- `--package` (Default: '', support forward slashes `/` for namespacing)
- `--namespace` (Default: '', derived from package, inverting slashes as namespaces uses backslashes `\`)
- `--short` (Default: '')
- `--singleton` (Default: '')
