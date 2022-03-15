const helpers = require('./helpers');

module.exports = (io, vlc, refresh, config, log) => {
    const checkDisconnect = (socket) => {
        if (!socket.request.session.loggedIn && config.server.login_password !== 'NULL') {
            log.warn(`[SOCKET.IO] User not logged in, disconnecting... (${socket.request.ip})`);
            socket.disconnect();
            return true;
        }
    }

    io.on('connection', (socket) => {
        log.info(`[SOCKET.IO] Socket connected (${socket.request.connection.remoteAddress})`);

        const refreshInterval = setInterval(async () => {
            checkDisconnect(socket);
            io.emit('refreshstats', await refresh());
        }, 500);
    
        socket.on('disconnect', () => {
            log.info(`[SOCKET.IO] Socket disconnected (${socket.request.connection.remoteAddress})`);
            clearInterval(refreshInterval);
        });

        checkDisconnect(socket);
    
        // controls
        socket.on('pause', async () => { 
            log.info(`[SOCKET.IO] VLC pause requested (${socket.request.connection.remoteAddress})`);
            if (checkDisconnect(socket) === true) {
                return;
            }
            await vlc.forcePause();
            io.emit('refresh', await refresh());
        });
    
        socket.on('play', async () => {
            log.info(`[SOCKET.IO] VLC play requested (${socket.request.connection.remoteAddress})`);
            if (checkDisconnect(socket) === true) {
                return;
            }
            const data = await vlc.updateAll();
            if (data[0].state !== 'playing') {
                vlc.pause();
            }
            io.emit('refresh', await refresh());
        });
    
        socket.on('stop', async () => {
            log.info(`[SOCKET.IO] VLC stop requested (${socket.request.connection.remoteAddress})`);
            if (checkDisconnect(socket) === true) {
                return;
            }
            vlc.stop();
            io.emit('refresh', await refresh());
        });
    
        socket.on('skip', async () => {
            log.info(`[SOCKET.IO] VLC skip requested (${socket.request.connection.remoteAddress})`);
            if (checkDisconnect(socket) === true) {
                return;
            }
            await vlc.playlistNext();
            io.emit('refresh', await refresh());
        });
    
        // shortcuts
        socket.on('fadeout', async () => {
            log.info(`[SOCKET.IO] VLC fade out requested (${socket.request.connection.remoteAddress})`);
            if (checkDisconnect(socket) === true) {
                return;
            }
            const data = await vlc.updateAll();
            while (data[0].volume > 0) {
                const newVolume = data[0].volume - 2;
                await vlc.setVolume(newVolume);
                data[0].volume = newVolume;
                await helpers.sleep(config.server.fadeout_wait);
            }
            vlc.stop();
            io.emit('refresh', await refresh());
        });
    
        socket.on('fadein', async () => {
            log.info(`[SOCKET.IO] VLC fade in requested (${socket.request.connection.remoteAddress})`);
            if (checkDisconnect(socket) === true) {
                return;
            }
            vlc.pause();
            const data = await vlc.updateAll();
            while (data[0].volume < Number(config.server.fadein_max)) {
                const newVolume = data[0].volume + 2;
                await vlc.setVolume(newVolume);
                data[0].volume = newVolume;
                await helpers.sleep(config.server.fadein_wait);
            }
            io.emit('refresh', await refresh());
        });
    
        socket.on('changevolume', async (type, amount, speed) => {
            log.info(`[SOCKET.IO] VLC change volume requested (${socket.request.connection.remoteAddress})`);
            if (checkDisconnect(socket) === true) {
                return;
            }
            const data = await vlc.updateAll();
            for (let i = 0; i < amount; i++) {
                let newVolume;
                if (type === 'decrease') {
                    if (Math.round(data[0].volume / 2.56) === 0) { 
                        break;
                    }
                    newVolume = data[0].volume - 2.56;
                } else if (type === 'increase') {
                    if (Math.round(data[0].volume / 2.56) === 100) { 
                        break;
                    }
                    newVolume = data[0].volume + 2.56;
                }
                await vlc.setVolume(newVolume);
                data[0].volume = newVolume;
                await helpers.sleep(speed);
            }
            io.emit('refresh', await refresh());
        });

        socket.on('changevolumeexact', async (val) => {
            log.info(`[SOCKET.IO] VLC change volume exact requested (${socket.request.connection.remoteAddress})`);
            if (checkDisconnect(socket) === true) {
                return;
            }
            await vlc.setVolume(val * 2.56);
            io.emit('refresh', await refresh());
        });

        // playback
        socket.on('clearplaylist', async () => {
            log.info(`[SOCKET.IO] VLC clear playlist requested (${socket.request.connection.remoteAddress})`);
            if (checkDisconnect(socket) === true) {
                return;
            }
            vlc.clearPlaylist();
            io.emit('refresh', await refresh());
        });

        socket.on('togglerandom', async () => {
            log.info(`[SOCKET.IO] VLC toggle random requested (${socket.request.connection.remoteAddress})`);
            if (checkDisconnect(socket) === true) {
                return;
            }
            await vlc.toggleRandom();
            io.emit('refresh', await refresh());
        });

        socket.on('toggleloop', async () => {
            log.info(`[SOCKET.IO] VLC toggle loop requested (${socket.request.connection.remoteAddress})`);
            if (checkDisconnect(socket) === true) {
                return;
            }
            await vlc.toggleLoop();
            io.emit('refresh', await refresh());
        });

        socket.on('togglerepeat', async () => {
            log.info(`[SOCKET.IO] VLC toggle repeat requested (${socket.request.connection.remoteAddress})`);
            if (checkDisconnect(socket) === true) {
                return;
            }
            await vlc.toggleRepeat();
            io.emit('refresh', await refresh());
        });
    });
};
