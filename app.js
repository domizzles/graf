var express = require('express');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var MongoClient = require('mongodb').MongoClient;
var app = express();
var credentials = require('./credentials.json')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser(process.env.SESSION_KEY || 'SECRETKEY'));
app.use(cookieSession({
    secret: process.env.SESSION_KEY || 'SECRETKEY',
    cookie: { maxAge: 432000000}
}));

app.get('/', function (req, res) {
    var name = req.session.name;
    var group = req.session.group;
    if(!name || !group) res.sendFile(__dirname + '/login.html');
    else res.sendFile(__dirname + '/index.html');
});

app.post('/login', function (req, res) {
    MongoClient.connect(credentials.host, function (err, client) {
        if (err) res.send(err);

        client.collection('grafusers').find({username: req.body.name, group: req.body.group}).toArray(function (err, result) {
            client.close();
            if (err) res.send(err);

            if(result.length) {
                req.session.name = req.body.name;
                req.session.group = req.body.group;
                res.redirect('/');
            }
            else res.redirect('/?error=true');
        });
    });
});

app.post('/logout', function (req, res) {
    req.session = null;
    res.redirect('/');
});

app.get('/style', function (req, res) {
    res.sendFile(__dirname + '/style.css');
});

app.get('/u', function (req, res) {
    MongoClient.connect(credentials.host, function (err, client) {
        if (err) res.send(err);

        if (req.query.username) {
            client.collection('grafusers').find({username: req.query.username}).toArray(function (err, result) {
                res.send(result);
                client.close();
            });
        } else if (req.query.group) {
            client.collection('grafusers').find({group: req.query.group}).toArray(function (err, result) {
                res.send(result);
                client.close();
            });
        } else {
            client.close();
            res.send({});
        }
    });
});

app.post('/u', function (req, res) {
    MongoClient.connect(credentials.host, function (err, client) {
        if (err) res.send(err);
        if (req.body.username && req.session.group) {
            client.collection('grafusers').find({username: req.body.username}).toArray(function (err, result) {
                if (err) res.send(err);

                if (!result[0]) {
                    client.collection('grafusers').insert({username: req.body.username.toLowerCase(), group: req.session.group}, function (err, new_user) {
                        res.send(new_user);
                        client.close();
                    });
                } else {
                    client.close();
                    res.send({error: 'username taken'})
                }
            });
        } else {
            client.close();
            res.send('No data.');
        }
    });
});

app.get('/w', function (req, res) {
    MongoClient.connect(credentials.host, function (err, client) {
        if (err) res.send(err);

        if (req.query.username && req.query.username instanceof Array) {
            client.collection('grafworkouts').find({
                username: {$in: req.query.username},
                date: {$gte: new Date(new Date() - 604800000)}
            }).toArray(function (err, result) {
                res.send(result);
                client.close();
            });
        } else if (req.query.username) {
            client.collection('grafworkouts').find({username: req.query.username}).toArray(function (err, result) {
                res.send(result);
                client.close();
            });
        } else {
            client.close();
            res.send({});
        }
    });
});

app.post('/w', function (req, res) {
    MongoClient.connect(credentials.host, function (err, client) {
        if (err) res.send(err);

        if (req.body.username) {
            client.collection('grafworkouts').insert({username: req.body.username, date: new Date()}, function (err, result) {
                res.send(result);
                client.close();
            });
        } else {
            client.close();
            res.send({});
        }
    });
});

app.delete('/w', function (req, res) {
    MongoClient.connect(credentials.host, function (err, client) {
        if (err) res.send(err);

        if (req.body.username) {
            var grafworkouts = client.collection('grafworkouts');
            grafworkouts.find({
                username: req.body.username
            }).sort({date: -1}).limit(1).toArray(function (err, result) {
                if (err) res.send(err);

                console.log(result[0]._id);

                grafworkouts.remove({_id: result[0]._id}, function (error, returned) {
                    if (error) res.send(error);

                    console.log(result);
                    res.send(result);
                    client.close();
                });
            });
        } else {
            client.close();
            res.send({});
        }
    });
});

app.get('/c', function (req, res) {
    res.send(req.session);
});

app.listen(process.env.PORT);

//passport
//implement login route (get and post)
//implement logout route (post)
//nvd3 graphs