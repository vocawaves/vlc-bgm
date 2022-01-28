const express = require('express');
const app = express();
const session = require('express-session');
const ratelimit = require('express-rate-limit');
const { VLC } = require('node-vlc-http');
const helpers = require('./modules/helpers.js');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const ini = require('ini');
const fs = require('fs');

if (!fs.existsSync('./LICENSES')) {
    helpers.getLicenses();
}

const licenses = fs.readFileSync('./LICENSES', 'utf8');

let config;
try {
    config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
} catch (e) {
    try {
        config = ini.parse(fs.readFileSync('../config.ini', 'utf8'));
    } catch (e) {
        console.log('No config file found. Please create a "config.ini" file from "config.example.ini". If this is not available, please look on the GitHub.');
        process.exit(1);
    }
}

if (config.express.ratelimit_enabled) {
    const limiter = ratelimit({
        windowMs: config.express.ratelimit_window,
        max: config.express.ratelimit_max
    });

    app.use(limiter);
}

const vlc = new VLC({
    host: config.vlc.host,
    port: config.vlc.port,
    username: '',
    password: config.vlc.password
});

app.use(session({
    secret: config.express.session_secret,
    name: config.express.session_name,
    cookie: {
      httpOnly: true,
      maxAge: Number(config.express.session_cookie_time)
    },
    resave: false,
    saveUninitialized: false
}));

app.use(express.urlencoded({
    extended: false
}));

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/assets/css/bulma.min.css', express.static('../node_modules/bulma/css/bulma.min.css'));
app.use('/assets/js/socket.io.min.js', express.static('../node_modules/socket.io-client/dist/socket.io.min.js'));

const refresh = async () => {
    const data = await vlc.updateAll();
    return {
        status: helpers.capitaliseStart(data[0].state),
        volume: Math.round(data[0].volume / 2.56)
    };
}

app.use(require('./modules/router.js')(config, refresh, licenses));
server.listen(config.server.port, () => {
    console.log(`Server started on port ${config.server.port}. License information can be found at http://localhost:${config.server.port}/licenses`);
});
require('./modules/socket.js')(io, vlc, refresh, config);

process.on('unhandledRejection', (e) => {
    console.log(e);
});
