// imports
const express = require('express');
const app = express();
const session = require('express-session');
const { VLC } = require('node-vlc-http');
const helpers = require('./helpers.js');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const ini = require('ini');
const fs = require('fs');

if (!fs.existsSync('./LICENSES')) {
    helpers.getLicenses();
}

const licenses = fs.readFileSync('./LICENSES', 'utf8');

// config
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
        volume: data[0].volume
    };
}

// routes
app.get('/login', (_req, res) => { 
    if (config.server.login_password === 'NULL') {
        return res.redirect('/');
    }

    res.render('login');
});

app.post('/login', (req, res) => {
    if (config.server.login_password === 'NULL') {
        return res.redirect('/');
    }

    if (req.body.password === config.server.login_password) {
        req.session.loggedIn = true;
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/', async (req, res) => {
    if (!req.session.loggedIn && config.server.login_password !== 'NULL') {
        return res.redirect('/login');
    }

    res.render('index', await refresh());
});

app.get('/licenses', (_req, res) => {
    res.render('licenses', {
        licenses
    });
});

server.listen(config.server.port, () => {
    console.log(`Server started on port ${config.server.port}. License information can be found at http://localhost:${config.server.port}/licenses`);
});

// socket
io.on('connection', (socket) => {
    // controls
    socket.on('pause', async () => { 
        vlc.pause();
        io.emit('refresh', await refresh());
    });

    socket.on('play', async () => { 
        vlc.pause();
        io.emit('refresh', await refresh());
    });

    socket.on('stop', async () => { 
        vlc.stop();
        io.emit('refresh', await refresh());
    });

    socket.on('skip', async () => { 
        vlc.playlistNext();
        io.emit('refresh', await refresh());
    });

    // shortcuts
    socket.on('fadeout', async () => {
        const data = await vlc.updateAll();
        while (data[0].volume > 0) {
            const newVolume = data[0].volume - 2;
            vlc.setVolume(newVolume);
            data[0].volume = newVolume;
            await helpers.sleep(config.server.fadeout_wait);
        }
        vlc.stop();
        io.emit('refresh', await refresh());
    });

    socket.on('fadein', async () => {
        vlc.pause();
        const data = await vlc.updateAll();
        while (data[0].volume < Number(config.server.fadein_max)) {
            const newVolume = data[0].volume + 2;
            vlc.setVolume(newVolume);
            data[0].volume = newVolume;
            await helpers.sleep(config.server.fadein_wait);
        }
        io.emit('refresh', await refresh());
    });

    socket.on('changevolume', async (type, amount, speed) => {
        const data = await vlc.updateAll();
        for (let i = 0; i < amount; i++) {
            let newVolume;
            if (type === 'decrease') {
                newVolume = data[0].volume - 2;
            } else if (type === 'increase') {
                newVolume = data[0].volume + 2;
            }
            vlc.setVolume(newVolume);
            data[0].volume = newVolume;
            await helpers.sleep(speed);
        }
        io.emit('refresh', await refresh());
    });
});

// catch err
process.on('unhandledRejection', (e) => {
    console.log(e);
});
