pg-validator
============

Simple PostgreSQL database schema validation and creation.

#Overview

An alternative to using sql files to ensure a specific schema

Takes a yaml file as input and does a `drop` `validate` `create` in that order, depending on command line flags.

#Installation

TODO: NPM

#Usage

  pg_validate [options]

  Options:

    -h, --help                      output usage information
    -V, --version                   output the version number
    -f, --file [file name]          schema definition file
    -h, --host [host name]          postgresql host name or ip
    -u, --user [user name]          postgresql user name
    -p, --password [user password]  postgresql password
    -d,  --drop                     drop schema tables
    -c, --create                    create schema


#License

MIT
