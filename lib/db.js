var util = require('util');
var async = require('async');
var Knex = require('knex');
var schema_parser = require('./schema_parser');

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
        nonsole.log(util.format('Dropped table %s',tableName));
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
  async.eachSeries(
    Object.keys(schema.tables),
    function(tableName, cb){
      knex.schema
        .hasTable(tableName)
        .exec(
          function(err, res){
            if(err || !res){
              return cb(
                util.format('Table %s does not exist', tableName),
                null
              );
            }
            async.eachSeries(
              Object.keys(schema.tables[tableName].columns),
              function(columnName, cb){
                knex.schema
                  .hasColumn(tableName, columnName)
                  .exec(function(err,res){
                    if(!res){
                      err = util.format('Table %s does not have column %s', tableName, columnName);
                    }
                    return cb(err,res);
                  });
              },
              function(err, res){
                if(err){
                  return cb(
                    err,
                    null
                  );
                }
                return cb(err, res);
              }
            );
          }
        );
    },
    function(err, res){
      return cb(err, res);
    }
  );
};


module.exports = new Db();
