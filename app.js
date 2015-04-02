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
    cookie: {
        maxAge: 1000*60*60
}}));

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

app.get('/w', function (req, res) {
    MongoClient.connect(credentials.host, function (err, client) {
        if (err) res.send(err);

        if (req.query.username && req.query.username instanceof Array) {
            client.collection('grafworkouts').find({username: {$in: req.query.username}}).toArray(function (err, result) {
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

app.get('/c', function (req, res) {
    res.send(req.session);
});

var server = app.listen(3000, function () {
    console.log('Example app listening at http://localhost:3000');
});

//passport
//implement login route (get and post)
//implement logout route (post)
//nvd3 graphs