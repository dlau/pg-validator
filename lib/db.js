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
  async.each(
      Object.keys(schema.tables),
      function(tableName, cb){
        console.log(util.format('Dropping table %s',tableName));
        //This should never be run arbitrarily from a forward facing server
        //Don't know whether this is  safe or not ...
        //!!!!!!!!DANGER!!!!!!!!!!!!!!!!!!!
        //!!!!!!!!DANGER!!!!!!!!!!!!!!!!!!!
        //!!!!!!!!DANGER!!!!!!!!!!!!!!!!!!!
        //!!!!!!!!DANGER!!!!!!!!!!!!!!!!!!!
        //!!!!!!!!DANGER!!!!!!!!!!!!!!!!!!!
        //Or else, how do we run CASCADE?
        if(tableName.search(/[^0-9a-zA-Z\-\_]*/)){
          return cb('Non alphanumeric table name ' + tableName);
        }
        knex.raw('DROP TABLE IF EXISTS ' + tableName + ' CASCADE').exec(cb);
      },
      function(err,res){
        return cb(err);
      }
  );
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
            var column = null;
            if(columnSchema.specificType){
              column = table.specificType(columnName, columnSchema.specificType);
            }
            else{
              column = table[columnSchema.type](columnName);
            }

            for(var key in columnSchema){
              //These are reserved keywords
              if(key === 'type' || key == 'specificType'){
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
        for(var tableCmd in schema.tables[tableName]){
            //reserved keyword
            if(tableCmd === 'columns'){
                continue;
            }
            var param = schema.tables[tableName][tableCmd];
            if(Array.isArray(param)){
                for(var i=0;i<param.length;++i){
                    table[tableCmd](param[i]);
                }
            }
            else{
                table[tableCmd](param);
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
