pg-validator
============

Simple PostgreSQL database schema validation and creation.

#Overview

An alternative to using sql files to ensure a specific schema

Takes a yaml file as input and does a `drop` `validate` `create` in that order, depending on command line flags.

#Installation

TODO: NPM

#Usage

  Usage: pg_validate [options]

  Options:

    -h, --help                      output usage information
    -V, --version                   output the version number
    -f, --file [file name]          schema definition file
    -h, --host [host name]          postgresql host name or ip
    -u, --user [user name]          postgresql user name
    -p, --password [user password]  postgresql password
    -z, --validate                  validate schema
    -d,  --drop                     drop schema tables
    -c, --create                    create schema

#Configuration files

Configuration files should be made one per database, consider the `simple.yaml` example:
```
---
#####
#An example db specification
#####
db_name : testdb
tables :
  neighbors :
    columns :
      id : increments
      name : string
      address :
        type : string
        unique : true
      spouse_name : 
        type : string
        defaultTo : No Spouse
    primary : id
    unique : name

  associates :
    columns :
      id : increments
      name : string
      address :
        type : string
        unique : true
      company_name : text
    primary : id
    unique : [name, company_name]
```

While relatively straightforward, `pg-validator` is a simple wrapper around the [Knex](https://github.com/tgriesser/knex) module. Database columns are either simple a string, denoting the type, or an object.

Columns that are defined as objects are required to have a `type`. Other parameters must follow the [Knex schema definition functions for columns](http://knexjs.org/#Chainable). In case the `knex` function does not have any parameters, the boolean value `true` should be used. This is demonstrated in the example above with the column `spouse_name`.


All table properties other than the reserved keyword `columns` map to table commands. An array denotes multiple calls, while nested arrays will translate to an array being passed to the  `knex` which is chained.

For example, to define multiple unique columns:
`unique : [col1, col2, col3]`

Compounded:
`unique : [[col1, col2]]`

Can mix and match, each element of the array maps to one chained `knex.table` call
`unique : [col1, [col2, col3]]`

#License

MIT
