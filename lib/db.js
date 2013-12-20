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
        if(tableName.search(/[^0-9a-zA-Z\-\_]*/)){
          return cb('Non alphanumeric table name ' + tableName);
        }
        //Potential injection point, how can we do a prepared statement?!?!
        //quoted table name does not work
        knex.raw(util.format('DROP TABLE IF EXISTS %s CASCADE', tableName)).exec(cb);
      },
      function(err,res){
        return cb(err);
      }
  );
};


Db.prototype.create = function(schema, cb){
  var knex = require('knex').knex;
  async.each(Object.keys(schema.tables), function(tableName, cb){
    async.waterfall([
      function(cb){
        knex.schema.hasTable(tableName).exec(cb);
      },
      function(exists, cb){
        if(exists){
          console.log('[WARNING] Table %s already exists, appending to table', tableName);
          return cb(null, null);
        }
        knex.schema.createTable(tableName, function(){}).exec(cb);
      },
      function(res, cb){
        async.each(Object.keys(schema.tables[tableName].columns),
         function(columnName, cb){
          knex.schema.table(tableName, function(table){
            columnSchema = schema.tables[tableName].columns[columnName];
            if(typeof columnSchema === 'string'){
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
          })
          .exec(function(err, res){
            if(!err){
              console.log(res);
            }
            return cb(null, res);
          });
        },
        function(err,res){
          cb(err,res);
        });
      },
      function(err, res){
        knex.schema.table(tableName, function(table){
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
        .exec(function(err, res){
          cb(null, res);
        });
      }],
      function(err, res){
        if(!err){
          console.log(util.format('Created table %s',tableName));
        }
        cb(err,res);
    });
  },
  function(err, res){
    cb(err);
  });

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
