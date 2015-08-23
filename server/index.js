var Hapi = require('hapi');

var credentials = require('../credentials');
var server = new Hapi.Server({});

server.connection({port: process.env.PORT || 80});

server.register([
    {register: require('inert')},
    {register: require('hapi-auth-cookie')},
    {register: require('./routes'), options: {credentials: credentials}}
], function (err) {
    if (err) throw (err);

    if (!module.parent) server.start(function () {
        console.log('Sever started!');
    });
});

process.on('SIGTERM', function () {
    server.stop({timeout: 5 * 1000}, function () {
        process.exit(0);
    });
});

module.exports = server;
