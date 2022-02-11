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

module.exports.getLicenses = () => {
    const modules = fs.readdirSync('../node_modules');
    const licenses = [];

    modules.forEach(module => {
        if (fs.fstatSync(fs.openSync('../node_modules/' + module)).isDirectory()) {
            if (fs.existsSync('../node_modules/' + module + '/LICENSE')) {
                const package = JSON.parse(fs.readFileSync('../node_modules/' + module + '/package.json'));
                const author = (package.author ? (typeof package.author === 'object' ? package.author.name : package.author) : package.contributors);
                const licenseText = 'vlc-bgm contains software by ' + (author) + '. This software is "' + package.name + '". The source code for this software can be found at ' + urlParser(package.homepage || 'https://npmjs.com/package/' + package.name) + '. A copy of the license and notice included in the software is displayed below:';
                licenses.push(licenseText + '<br/><br/>' + fs.readFileSync(`../node_modules/${module}/LICENSE`, 'utf8').replace(/(?:\r\n|\r|\n)/g, '<br>').replace(/\n\s*\n/g, "<br/><br/>") + '\n\n' + '<hr/>');
            }
        }
    });
    fs.writeFileSync('./LICENSES', licenses.join(''), 'utf8');
};