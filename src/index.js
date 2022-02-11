const Logger = require('leekslazylogger');
const log = new Logger({
    transports: [
        new Logger.transports.ConsoleTransport()
    ]
});

log.info('[SERVER] Starting vlc-bgm...');

const express = require('express');
const app = express();
const session = require('cookie-session');
const ratelimit = require('express-rate-limit');
const { VLC } = require('node-vlc-http');
const helpers = require('./modules/helpers.js');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const ini = require('ini');
const fs = require('fs');
const os = require('os');

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
        log.error('[SERVER] No config file found. Please create a "config.ini" file from "config.example.ini". If this is not available, please look on the GitHub.');
        process.exit(1);
    }
}

if (config.express.ratelimit_enabled) {
    app.use(ratelimit({
        windowMs: config.express.ratelimit_window,
        max: config.express.ratelimit_max
    }));
}

const vlc = new VLC({
    host: config.vlc.host,
    port: config.vlc.port,
    username: '',
    password: config.vlc.password
});

const sessionMiddleware = session({
    secret: config.express.session_secret,
    name: config.express.session_name,
    maxAge: Number(config.express.session_cookie_time)
});
app.use(sessionMiddleware);
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

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

app.use(require('./modules/router.js')(config, refresh, licenses, log));

app.use((err, _req, res, _next) => { 
    log.error(err);
    return res.render('error', {
        code: 500,
        message: 'An error occured'
    });
});

server.listen(config.server.port, () => {
    const networkInterfaces = os.networkInterfaces();
    log.info(`[SERVER] Started!
    vlc-bgm server is running on port ${config.server.port}
    Connect locally: http://localhost:${config.server.port}
    Connect on your network: http://[${networkInterfaces['Ethernet'][0].address}]:${config.server.port}
    License information can be found at http://localhost:${config.server.port}/licenses`);
});
require('./modules/socket.js')(io, vlc, refresh, config, log);

server.on('error', (err) => { 
    if (err.code === 'EADDRINUSE') { 
        log.error('[SERVER] Port is already in use. Please close the program using it or change the port in the config file.');
        process.exit(1);
    }

    log.error(err);
});

process.on('unhandledRejection', (e) => {
    if (e.code === 'ECONNREFUSED') {
        return log.error('[SERVER] Could not connect to vlc. Please check your config file and that vlc is running.');
    }

    log.error(e);
});
