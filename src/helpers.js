module.exports.capitaliseStart = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}  

module.exports.sleep = (ms) => { 
    return new Promise(resolve => setTimeout(resolve, Number(ms)));
}
