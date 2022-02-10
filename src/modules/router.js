const router = require('express').Router();

module.exports = (config, refresh, licenses, log) => {
    router.get('/login', (req, res) => { 
        log.info(`[HTTP] /login requested (${req.ip})`);
        if (config.server.login_password === 'NULL') {
            return res.redirect('/');
        }
    
        res.render('login', {
            error: ''
        });
    });
    
    router.post('/login', (req, res) => {
        log.info(`[HTTP] /login post requested (${req.ip})`);

        if (config.server.login_password === 'NULL') {
            return res.redirect('/');
        }
    
        if (req.body.password === config.server.login_password) {
            log.info(`[HTTP] User logged in (${req.ip})`);
            req.session.loggedIn = true;
            res.redirect('/');
        } else {
            log.warn(`Incorrect password (${req.ip})`);
            res.render('login', {
                error: 'Incorrect password.'
            });
        }
    });
    
    router.get('/logout', (req, res) => {
        log.info(`[HTTP] /logout requested (${req.ip})`);
        req.session = null;
        res.redirect('/login');
    });
    
    router.get('/', async (req, res) => {
        log.info(`[HTTP] / requested (${req.ip})`);
        if (!req.session.loggedIn && config.server.login_password !== 'NULL') {
            log.warn(`[HTTP] / user not logged in (${req.ip})`);
            return res.redirect('/login');
        }
    
        try {
          res.render('index', await refresh());
        } catch (e) { 
          log.error(`[HTTP] Failed to connect to VLC (${req.ip})`);
          res.render('error', {
            code: 500,
            message: 'Failed to connect to VLC'
          });
        }
    });
    
    router.get('/licenses', (req, res) => {
        log.info(`[HTTP] /licenses requested (${req.ip})`);
        res.render('licenses', {
            licenses
        });
    });
    
    router.get('*', (req, res) => {
        log.info(`[HTTP] /404 page requested (${req.ip})`);
        if (!req.session.loggedIn && config.server.login_password !== 'NULL') {
            log.warn(`[HTTP] /404 user not logged in (${req.ip})`);
            return res.redirect('/login');
        }
    
        res.render('error', {
            code: 404,
            message: 'Page not found'
        });
    });

    return router;
};
