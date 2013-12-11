var util = require('util');
var schema_parser = require('./schema_parser');
var Knex = require('knex');

var Db = function(options){
};

Db.prototype.init = function(options){
  Knex.knex = Knex.initialize({
    client : 'postgresql',
    connection : {
      host : options.host,
      user : options.user,
      password : options.password,
      database : options.db_name,
      verbose : options.verbose
    }
  });
};
Db.prototype.drop = function(schema, cb){
  var knex = require('knex').knex;
  for(var tableName in schema.tables){
    knex.schema
      .dropTableIfExists(tableName)
      .then(function(){
        console.log(util.format('Dropped table %s',tableName));
        return cb(null);
      });
  }
};


Db.prototype.create = function(schema, cb){
  var knex = require('knex').knex;
  for(var tableName in schema.tables){
    knex.schema
      .createTable(tableName, function(table){
        for(var columnName in schema.tables[tableName].columns){
          columnSchema = schema.tables[tableName].columns[columnName];
          if(typeof columnSchema === 'string'){
            console.log(util.format('Added column %s to table %s', columnName,tableName));
            table[columnSchema](columnName);
          }
          //Assume it is an object now, or else let it throw an exception otherwise
          else{
            //set
            column = table[columnSchema.type](columnName);

            for(var key in columnSchema){
              if(key === 'type'){
                continue;
              }
              else if(typeof columnSchema[key] ===  'boolean'){
                column[key]();
              }
              else{
                column[key](columnSchema[key]);
              }
            }
          }
        }
      })
      .then(function(){
        console.log(util.format('Created table %s',tableName));
        return cb(null);
      });
  }

};

Db.prototype.validate = function(schema, cb){
  var knex = require('knex').knex;
  for(var tableName in schema.tables){
    knex.schema
      .hasTable(tableName)
      .then(function(exists){
        if(!exists){
          throw util.format('[ERROR] Table %s does not exist', tableName);
        }
        for(var columnName in schema.tables[tableName]){
          knex.schema
            .hasColumn(columnName)
            .then(function(exists){
              if(!exists){
                throw util.format('[ERROR] Table %s does not have column %s', tableName, columnName);
              }
            });
        }
      });
  }
};


module.exports = new Db();
