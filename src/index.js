process.title = 'vlc-bgm';

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
const path = require('path');
const eta = require('eta');

if (!fs.existsSync(path.join(__dirname, 'LICENSES'))) {
    log.info('[SERVER] LICENSES file doesn\'t exist, creating...');
    helpers.getLicenses();
}

const licenses = fs.readFileSync(path.join(__dirname, 'LICENSES'), 'utf8');

let config;
let success = true;
const configCheck = async () => {
    try {
        config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
    } catch (e) {
        log.error('[SERVER] No config file found. Please create a "config.ini" file from "config.example.ini". If this is not available, please look on the GitHub (https://github.com/davidcralph/vlc-bgm). Press any key to exit.');
        success = false;
        await helpers.keypress();
        process.exit(1);
    }
}

configCheck();

if (!success) {
    return;
}

if (config.express.ratelimit_enabled) {
    if (!Number(config.express.ratelmit_window) || !Number(config.express.ratelimit_max)) { 
        log.warn('[SERVER] Ratelimit settings are invalid, disabling ratelimiter. Please check your config.ini file.');
    } else {
        app.use(ratelimit({
            windowMs: config.express.ratelimit_window,
            max: config.express.ratelimit_max
        }));
    }
}

const vlcCheck = async () => {
    if (!config.vlc.host || !config.vlc.port || !config.vlc.password || config.vlc.port <= 0 || config.vlc.port > 65536) { 
        log.error('[SERVER] VLC settings are invalid, Please check your config.ini file. Press any key to exit.');
        success = false;
        await helpers.keypress();
        process.exit(1);
    }
}

vlcCheck();

if (!success) {
    return;
}

const vlc = new VLC({
    host: config.vlc.host,
    port: config.vlc.port,
    username: '',
    password: config.vlc.password,
    autoUpdate: false
});

process.on('unhandledRejection', (e) => {
    if (e.code === 'ECONNREFUSED') {
        return log.error('[SERVER] Could not connect to vlc. Please check your config file and that vlc is running.');
    }

    log.error(e);
});

const sessionCheck = async () => {
    if (!config.express.session_secret || !config.express.session_name || !Number(config.express.session_cookie_time)) { 
        log.error('[SERVER] Session settings are invalid, Please check your config.ini file. Press any key to exit.');
        success = false;
        await helpers.keypress();
        process.exit(1);
    } 
}

sessionCheck();

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

eta.configure({
    cache: process.env.NODE_ENV === 'production'
});
app.engine('eta', eta.renderFile);
app.set('view engine', 'eta');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets/css/bulma.min.css', express.static('../node_modules/bulma/css/bulma.min.css'));
app.use('/assets/js/socket.io.min.js', express.static('../node_modules/socket.io/client-dist/socket.io.min.js'));

const refresh = async () => {
    const data = await vlc.updateAll();
    return {
        status: helpers.capitaliseStart(data[0].state),
        volume: Math.round(data[0].volume / 2.56),
        song: data[0].information ? data[0].information.category.meta.filename : 'None',
        playback: `random = ${data[0].random}, loop = ${data[0].loop}, repeat = ${data[0].repeat}`,
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

const portCheck = async () => {
    if (config.server.port <= 0 || config.server.port > 65536) { 
        log.error('[SERVER] Invalid port number, please check your config.ini file. Press any key to exit.');
        success = false;
        await helpers.keypress();
        process.exit(1);
    }
}

portCheck();

if (!success) { 
    return;
}

server.listen(config.server.port, () => {
    const networkInterfaces = os.networkInterfaces();
    log.info(`[SERVER] Started!
    vlc-bgm server is running on port ${config.server.port}
    Connect locally: http://localhost:${config.server.port}
    Connect on your network: http://[${networkInterfaces['Ethernet'][0].address}]:${config.server.port}
    License information can be found at http://localhost:${config.server.port}/licenses`);
});
require('./modules/socket.js')(io, vlc, refresh, config, log);

server.on('error', async (err) => { 
    if (err.code === 'EADDRINUSE') { 
        log.error('[SERVER] Port is already in use. Please close the program using it or change the port in the config file. Press any key to exit.');
        await helpers.keypress();
        process.exit(1);
    }

    log.error(err);
});
