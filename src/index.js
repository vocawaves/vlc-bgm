const express = require('express');
const app = express();
const session = require('express-session');
const { VLC } = require('node-vlc-http');
const helpers = require('./helpers.js');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const ini = require('ini');
const fs = require('fs');

const config = ini.parse(fs.readFileSync('../config.ini', 'utf8'));

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

    const data = await vlc.updateAll();
    res.render('index', {
        status: helpers.capitaliseStart(data[0].state),
        volume: data[0].volume
    });
});

server.listen(config.server.port);

io.on('connection', (socket) => {
    // controls
    socket.on('pause', async () => { 
        vlc.pause();
        io.emit('refresh');
    });

    socket.on('play', async () => { 
        vlc.pause();
        io.emit('refresh');
    });

    socket.on('stop', async () => { 
        vlc.stop();
        io.emit('refresh');
    });

    socket.on('skip', async () => { 
        vlc.playlistNext();
        io.emit('refresh');
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
        io.emit('refresh');
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
        io.emit('refresh');
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
        io.emit('refresh');
    });
});

process.on('unhandledRejection', (e) => {
    console.log(e);
});
