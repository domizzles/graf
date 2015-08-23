var async = require('async');
var Boom = require('boom');
var cheerio = require('cheerio');
var fs = require('fs');
var Joi = require('joi');
var moment = require('moment');
var MongoClient = require('mongodb').MongoClient;
var Path = require('path');
var request = require('request-promise');

var ROOT = Path.join(__dirname, '..', '..');

exports.register = function (server, options, next) {
    if (!options.credentials) return next(new Error('Missing credentials.'));

    var secondsToLive = 5184000;

    server.auth.strategy('session', 'cookie', {
        cookie: 'credentials',
        isSecure: false,
        keepAlive: true,
        password: options.credentials.authPassword,
        redirectTo: '/login',
        ttl: secondsToLive * 1000
    });

    server.route({
        method: 'GET',
        path: '/',
        config: {
            handler: function (req, reply) {
                MongoClient.connect(options.credentials.db, function (error, client) {
                    if (error) return reply(error);

                    var users = client.collection('grafusers');
                    users.findOne({
                        username: req.auth.credentials.username
                    }, function (error, user) {
                        client.close();
                        if (error) return reply(error);

                        fs.readFile(Path.join(ROOT, 'index.html'), 'utf8', function (error, index) {
                            if (error) return reply(error);

                            var $ = cheerio.load(index);
                            $('head').append('<meta name="username" content="' + encodeURIComponent(user.username) + '">');

                            return reply($.html());
                        });
                    });
                })
            },
            auth: 'session'
        }
    });

    server.route({
        method: ['GET', 'POST'],
        path: '/login',
        config: {
            handler: function (req, reply) {
                if (req.auth.isAuthenticated) return reply.redirect('/');
                if (req.method.toLowerCase() === 'post') {
                    MongoClient.connect(options.credentials.db, function (error, client) {
                        if (error) return reply(error);

                        var password = new Buffer(req.payload.password).toString('base64');
                        client.collection('grafusers').findOne({
                            username: req.payload.username,
                            password: password
                        }, function (error, user) {
                            client.close();
                            if (error) return reply(error);

                            if (!user)
                                return fs.readFile(Path.join(ROOT, 'server', 'templates', 'login.html'), 'utf8', function (error, index) {
                                    if (error) return reply(error);

                                    var $ = cheerio.load(index);
                                    $('#messages').append('<p style="color:#f00">Login failed. Try again.</p>');

                                    return reply($.html());
                                });;

                            req.auth.session.set({
                                username: req.payload.username
                            });

                            reply.redirect('/');
                        });
                    });
                } else fs.readFile(Path.join(ROOT, 'server', 'templates', 'login.html'), 'utf8', function (error, index) {
                    if (error) return reply(error);

                    return reply(index);
                });
            },
            auth: {
                mode: 'try',
                strategy: 'session'
            },
            plugins: {
                'hapi-auth-cookie': {
                    redirectTo: false
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/create',
        config: {
            handler: {
                file: Path.join(ROOT, 'server', 'templates', 'create.html')
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/confirm',
        config: {
            handler: {
                file: Path.join(ROOT, 'server', 'templates', 'confirm.html')
            }
        }
    });

    server.route({
        path: '/logout',
        method: 'GET',
        config: {
            handler: function (req, reply) {
                req.auth.session.clear();
                reply.redirect('/');
            },
            auth: 'session'
        }
    });

    server.route({
        method: 'POST',
        path: '/update-password',
        config: {
            handler: function (req, reply) {
                MongoClient.connect(options.credentials.db, function (error, client) {
                    if (error) return reply(error);

                    client.collection('grafusers').findOne({
                        username: req.auth.credentials.username
                    }, function (error, user) {
                        if (error) return reply(error);

                        if (user.password === new Buffer(req.payload.current_password).toString('base64')) {
                            if (req.payload.new_password === req.payload.ver_password) {
                                users.update({
                                    username: req.auth.credentials.username
                                }, {
                                    $set: {password: new Buffer(req.payload.new_password).toString('base64')}
                                }, function (error) {
                                    client.close();
                                    if (error) return reply(error);
                                    else return reply({error: false, message: 'Password successfully changed.'});
                                });
                            } else return reply(Boom.badRequest('New password and verified password did not match.'));
                        } else return reply(Boom.unauthorized('Incorrect current password.'));
                    });
                });
            },
            auth: 'session'
        }
    });

    server.route({
        method: 'GET',
        path: '/workout/{username}',
        config: {
            handler: function (req, reply) {
                MongoClient.connect(options.credentials.db, function (error, client) {
                    if (error) return reply(error);

                    client.collection('grafworkouts').find({
                        username: req.params.username,
                        date: {
                            $lte: req.query.end_date,
                            $gte: req.query.start_date
                        }
                    }, {_id: 0}).count(function (error, count) {
                        client.close();
                        if (error) return reply(error);

                        return reply({data: count});
                    });
                });
            },
            validate: {
                query: {
                    start_date: Joi.date().required(),
                    end_date: Joi.date().min(Joi.ref('start_date')).required()
                }
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/workout',
        config: {
            handler: function (req, reply) {
                MongoClient.connect(options.credentials.db, function (error, client) {
                    if (error) return reply(error);

                    client.collection('grafworkouts').insert({
                        username: req.auth.credentials.username,
                        date: new Date()
                    }, function (error) {
                        client.close();
                        if (error) return reply(error);
                        return reply({success: true});
                    });
                });
            },
            auth: 'session'
        }
    });

    server.route({
        method: 'DELETE',
        path: '/workout',
        config: {
            handler: function (req, reply) {
                MongoClient.connect(options.credentials.db, function (error, client) {
                    if (error) return reply(error);

                    var grafworkouts = client.collection('grafworkouts');

                    grafworkouts.find({
                        username: req.auth.credentials.username
                    }).sort({date: -1}).limit(1).toArray(function (error, workout) {
                        if (error) return reply(error);

                        grafworkouts.remove({_id: workout[0]._id}, function (error) {
                            client.close();
                            if (error) return reply(error);
                            return reply({success: true});
                        });
                    });
                });
            },
            auth: 'session'
        }
    });

    server.route({
        method: 'GET',
        path: '/group/{username}',
        config: {
            handler: function (req, reply) {
                MongoClient.connect(options.credentials.db, function (error, client) {
                    if (error) return reply(error);

                    client.collection('grafgroups').find({ members: req.params.username }, {_id: 0}).toArray(function (error, groups) {
                        client.close();
                        if (error) return reply(error);

                        return reply({data: groups});
                    });
                });
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/group',
        config: {
            handler: function (req, reply) {
                MongoClient.connect(options.credentials.db, function (error, client) {
                    if (error) return reply(error);

                    var grafgroups = client.collection('grafgroups');
                    grafgroups.findOne({ name: req.payload.name }, function (error, group) {
                        if (error) return reply(error);

                        if (!group) {
                            grafgroups.insert({
                                name: req.payload.name,
                                members: [req.auth.credentials.username]
                            }, function (error) {
                                client.close()
                                return reply(error);
                                return reply({success: true});
                            });
                        } else {
                            grafgroups.update({
                                name: req.payload.name
                            }, {
                                $addToSet: {members: req.auth.credentials.username}
                            }, function (error) {
                                client.close()
                                return reply(error);
                                return reply({success: true});
                            });
                        }
                    });
                });
            },
            auth: 'session',
            validate: {
                payload: {
                    name: Joi.string().lowercase().required()
                }
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/user',
        config: {
            handler: function (req, reply) {
                MongoClient.connect(options.credentials.db, function (error, client) {
                    if (error) return reply(error);

                    var grafusers = client.collection('grafusers');

                    grafusers.findOne({ username: req.payload.username }, function (error, user) {
                        if (error) return reply(error);

                        if (!user) {
                            return grafusers.insert({
                                username: req.payload.username,
                                password: new Buffer(req.payload.password).toString('base64')
                            }, function (error) {
                                client.close();
                                if (error) return reply(error);
                                return reply().redirect('/confirm');
                            });
                        }
                        else {
                            client.close();
                            return reply(Boom.conflict('user already exists'));
                        }
                    });
                });
            },
            validate: {
                payload: {
                    username: Joi.string().lowercase().required(),
                    password: Joi.string().required()
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/trend/{username}',
        config: {
            handler: function (req, reply) {
                MongoClient.connect(options.credentials.db, function (error, client) {
                    if (error) return reply(error);

                    var grafworkouts = client.collection('grafworkouts');

                    function getWorkouts (start, end, callback) {
                        grafworkouts.find({
                            username: req.params.username,
                            date: {
                                $gte: start,
                                $lt: end
                            }
                        }).count(function (error, count) {
                            if (error) return callback(error);
                            return callback(null, {workouts: count});
                        });
                    }

                    async.parallel([
                        function (callback) {
                            getWorkouts(
                                req.query.start_date,
                                moment().startOf('week').subtract(2, 'weeks').subtract(1, 'ms').toDate(),
                                callback
                            );
                        },
                        function (callback){
                            getWorkouts(
                                moment().startOf('week').subtract(2, 'weeks').toDate(),
                                moment().startOf('week').subtract(1, 'week').subtract(1, 'ms').toDate(),
                                callback
                            );
                        },
                        function (callback){
                            getWorkouts(
                                moment().startOf('week').subtract(1, 'week').toDate(),
                                moment().startOf('week').subtract(1, 'ms').toDate(),
                                callback
                            );

                        },
                        function (callback){
                            getWorkouts(
                                moment().startOf('week').toDate(),
                                moment().toDate(),
                                callback
                            );
                        }
                    ], function (error, result) {
                        client.close();
                        if (error) return reply(error);
                        return reply(result);
                    });
                });
            },
            validate: {
                query: {
                    start_date: Joi.date().required()
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/{filename*}',
        handler: {
            directory: {
                path: Path.join(ROOT, 'dist')
            }
        }
    });

    next();
};

exports.register.attributes = {
    name: 'engage-routes',
    version: require('../../package.json').version
};
