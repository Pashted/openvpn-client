const openvpnClient = require('./index.js');

const args = {
    path:    openvpnClient.defaultPath,
    config:  './config.ovpn',
    verbose: true,
};
openvpnClient.init(args)
    .then(async () => {
        let timer = 3;
        while (timer) {
            console.log(timer--);
            await new Promise(r => setTimeout(r, 1000));
        }
        openvpnClient.exit();

        await new Promise(r => setTimeout(r, 5000));
    })
    .catch(async err => {
        console.error(err);
        await new Promise(r => setTimeout(r, 5000));
    });
