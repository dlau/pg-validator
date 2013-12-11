require('js-yaml');
var tv4 = require('tv4');

var schema = {
  title : 'PostgreSQL database format schema',
  type : 'object',
  required : ['db_name', 'tables'],
  properties : {
    'db_name' : {
      type : 'string'
    },
    'tables' : {
      type : 'object',
      patternProperties: {
        '^[a-z]+$': {
          type : 'object',
          properties : {
            'columns' : {
              type : ['object', 'string']
            },
            'primary_key' : 'string'
          }
        }
      }
    },
    minItems : 1
  }
};

var Schema = function(schemaFile){
  var doc = require(schemaFile);
  if(!tv4.validate(doc, schema)){
    throw tv4.error;
  }
  return doc;
};


module.exports = Schema;
