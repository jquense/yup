"use strict"
var _ = require('lodash')
  , ajax = require('./ajax');

module.exports = function sync(action, model, options) {
    var map = {
            read:     'GET',
            create:   'POST',
            update:   'PUT',
            'delete': 'DELETE'
        },
        params = {
            type: map[action], 
            dataType: 'json'
        };

    options || (options = {})

    if (!options.url) 
        params.url = _.result(model, 'url') || urlError()

    if (options.data == null && model && (action === 'create' || action === 'update' || action === 'patch')) {
        params.contentType = 'application/json'
        params.data = JSON.stringify(model.toJSON())
    } 

    return ajax(_.extend(params, options))
};


function urlError() {
    throw new Error('A "url" property or function must be specified');
};
