const fs = require('fs');

module.exports.capitaliseStart = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports.sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, Number(ms)));
}

module.exports.keypress = async () => {
    process.stdin.setRawMode(true);
    return new Promise((resolve) => process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        resolve();
    }));
}

// generate content for /licenses page

// based on https://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
function urlParser(input) {
    const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_+.~#?&//=]*)/;
    return input.replace(urlPattern, '<a href="$&" target="_blank">$&</a>');
}

function pushLicense(dir, file) {
    const pkg = JSON.parse(fs.readFileSync(dir + '/package.json'));
    const author = (pkg.author ? (typeof pkg.author === 'object' ? pkg.author.name : pkg.author) : pkg.contributors ? (Array.isArray(pkg.contributors) ? (pkg.contributors.map((contributor) => contributor.name || contributor)).join(', ') : pkg.contributors) : pkg.name.split('/')[0]);
    const licenseText = 'vlc-bgm contains software by ' + (author) + '. This software is "' + pkg.name + '". The source code for this software can be found at ' + urlParser(pkg.homepage || 'https://npmjs.com/package/' + pkg.name) + '. A copy of the license and notice included in the software is displayed below:';
    return licenseText + '<br/><br/>' + fs.readFileSync(`${dir}/${file}`, 'utf8').replace(/(?:\r\n|\r|\n)/g, '<br>').replace(/\n\s*\n/g, "<br/><br/>") + '\n\n' + '<hr/>';
}

function checkDirectory(dir) {
    if (fs.existsSync(dir + '/LICENSE')) {
        return pushLicense(dir, 'LICENSE');
    } else if (fs.existsSync(dir + '/LICENSE.md')) {
        return pushLicense(dir, 'LICENSE.md');
    } else if (fs.existsSync(dir + '/LICENSE.txt')) {
        return pushLicense(dir, 'LICENSE.txt');
    } else if (fs.existsSync(dir + '/license')) {
        return pushLicense(dir, 'license');
    } else if (fs.existsSync(dir + '/license.md')) {
        return pushLicense(dir, 'license.md');
    } else if (fs.existsSync(dir + 'LICENSE.MIT')) {
        return pushLicense(dir, 'LICENSE.MIT');
    } else {
        return null;
    }
}

module.exports.getLicenses = () => {
    const modules = fs.readdirSync('../node_modules');
    const licenses = [];

    modules.forEach((module) => {
        const moduleDir = '../node_modules/' + module;
        if (fs.fstatSync(fs.openSync(moduleDir)).isDirectory()) {
            if (!fs.existsSync(moduleDir + '/package.json')) {
                const authormodules = fs.readdirSync(moduleDir);
                authormodules.forEach((authormodule) => {
                    const authormodulefiles = moduleDir + '/' + authormodule;
                    if (fs.existsSync(moduleDir + '/' + authormodule + '/package.json')) {
                        const licenseText = checkDirectory(authormodulefiles);
                        if (licenseText) {
                            licenses.push(licenseText);
                        }
                    }
                });
            }
            if (fs.existsSync(moduleDir + '/node_modules')) { 
                const submodules = fs.readdirSync(moduleDir + '/node_modules');
                submodules.forEach((submodule) => {
                    const submoduleDir = moduleDir + '/node_modules/' + submodule;
                    const licenseText = checkDirectory(submoduleDir);
                    if (licenseText) {
                        licenses.push(licenseText);
                    }
                });
            } else {
                const licenseText = checkDirectory(moduleDir);
                if (licenseText) {
                    licenses.push(licenseText);
                }
            }
        }
    });
    fs.writeFileSync('./LICENSES', licenses.join(''), 'utf8');
};
