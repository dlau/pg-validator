var path = require('path');
var async = require('async');
var commander = require('commander');

var db = require('./db');
var schema_parser = require('./schema_parser');

module.exports = function(){
  commander
    .version('0.0.1')
    .option('-f, --file [file name]', 'schema definition file')
    .option('-h, --host [host name]', 'postgresql host name or ip')
    .option('-u, --user [user name]', 'postgresql user name')
    .option('-p, --password [user password]', 'postgresql password')
//    validation currently broken
//    .option('-z, --validate', 'validate schema')
    .option('-d,  --drop', 'drop schema tables')
    .option('-c, --create', 'create schema')
    .parse(process.argv);

  if(!commander.file || !commander.host){
    commander.help();
  }

  var schema = schema_parser(path.resolve(process.cwd(), commander.file));

  //init the db
  db.init({
    host : commander.host,
    user : commander.user,
    password : commander.password,
    db_name : schema.db_name,
    verbose : true
  });

  async.waterfall([
      function(cb){
        if(commander.drop){
          return db.drop(schema, cb);
        }
        return cb(null);
      },
      function(cb){
        if(commander.create){
          return db.create(schema, cb);
        }
        return cb(null);
      },
      //function(cb){
        //if(commander.validate){
          //return db.validate(schema, cb);
        //}
        //return cb(null);
      //}
    ],
    function(err,res){
      if(err){
        console.log('[ERROR] %s', err);
      }
      process.exit(code=0);
    }
  );
};
