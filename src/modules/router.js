const router = require('express').Router();

module.exports = (config, refresh, licenses, log) => {
    router.get('/login', (_req, res) => { 
        log.info('Login page requested');
        if (config.server.login_password === 'NULL') {
            return res.redirect('/');
        }
    
        res.render('login', {
            error: ''
        });
    });
    
    router.post('/login', (req, res) => {
        if (config.server.login_password === 'NULL') {
            return res.redirect('/');
        }
    
        if (req.body.password === config.server.login_password) {
            req.session.loggedIn = true;
            res.redirect('/');
        } else {
            res.render('login', {
                error: 'Incorrect password.'
            });
        }
    });
    
    router.get('/logout', (req, res) => {
        log.info('Logout page requested');
        req.session = null;
        res.redirect('/login');
    });
    
    router.get('/', async (req, res) => {
        log.info('Home page requested');
        if (!req.session.loggedIn && config.server.login_password !== 'NULL') {
            log.warn('User not logged in');
            return res.redirect('/login');
        }
    
        try {
          res.render('index', await refresh());
        } catch (e) { 
          res.render('error', {
            code: 500,
            message: 'Failed to connect to VLC'
          });
        }
    });
    
    router.get('/licenses', (_req, res) => {
        log.info('License page requested');
        res.render('licenses', {
            licenses
        });
    });
    
    router.get('*', (req, res) => {
        log.info('404 page requested');
        if (!req.session.loggedIn && config.server.login_password !== 'NULL') {
            log.warn('User not logged in');
            return res.redirect('/login');
        }
    
        res.render('error', {
            code: 404,
            message: 'Page not found'
        });
    });

    return router;
};
