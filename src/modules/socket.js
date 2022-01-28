module.exports = (io, vlc, refresh, config) => {
    io.on('connection', (socket) => {
        const refreshInterval = setInterval(async () => {
            io.emit('refreshstats', await refresh());
        }, 500);
    
        socket.on('disconnect', () => { 
            clearInterval(refreshInterval);
        });
    
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
}