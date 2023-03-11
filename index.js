const path = require('path');
const { spawn } = require('child_process');

let daemon;
let attempt = 0;

module.exports = {
    /**
     * @param args {object}
     * @return {Promise<void>}
     */
    async init(args) {
        const params = Object.assign({
            path:    'openvpn', // path to the client executable. you can also use PATH env variable
            config:  './config.ovpn', // path to the openvpn config file
            verbose: false,
        }, args);
        params.config = path.resolve(params.config);

        let errors = [];
        let idle;

        try {
            await new Promise((resolve, reject) => {
                idle = setTimeout(() => {
                    this.exit();
                    reject(new Error('Timeout error'));
                }, 30000);
                return runDaemon({
                    command:   params.path,
                    argsArray: getArgsArray(params),
                    verbose:   params.verbose,
                    onMessage(msg) {
                        if (/failed|denied|error|not found/.test(msg))
                            errors.push(msg);
                        if (/Initialization Sequence Completed/.test(msg))
                            resolve(msg);
                    },
                }).catch(reject);
            });

        } catch (err) {
            errors.push(err.message);
        }

        clearTimeout(idle);

        if (errors.length) {
            errors.forEach(err => console.warn(err));
            if (++attempt < 3) {
                await new Promise(r => setTimeout(r, attempt * 2000));
                return this.init(args);
            }
            throw new Error('Init failed');
        }

        console.log('Connected');
        attempt = 0;
    },

    exit() {
        daemon?.kill();
        daemon = null;
    },

    /**
     * For testing purposes
     * @return {string}
     */
    get defaultPath() {
        switch (process.platform) {
            case 'win32':
                return 'C:\\Program Files\\OpenVPN\\bin\\openvpn.exe';
            case 'linux':
                return '/usr/local/opt/openvpn/sbin/openvpn';
        }
        throw new Error(`Unsupported platform: ${process.platform}`);
    },

};

/**
 * @param args {object}
 * @return {string[]}
 */
function getArgsArray(args) {
    const _args = Object.assign({}, args ?? {});
    let result = [
        '--config', _args.config,
        '--cd', process.cwd(),
        '--errors-to-stderr',
    ];

    switch (process.platform) {
        case 'win32':
            return result;
        case 'linux':
            return [
                ...result,
                '--daemon',
                '--dev', 'tun0',
            ];
        default:
            throw new Error(`Unsupported platform: ${process.platform}`);
    }
}

/**
 * @param command {string}
 * @param argsArray {string[]}
 * @param verbose {boolean}
 * @param onMessage {function}
 * @return {Promise<string>}
 */
function runDaemon({ command, argsArray, verbose, onMessage } = {}) {
    const [ name ] = command.split(/[/\\]+/g).slice(-1);
    if (daemon)
        throw new Error(`${name} is already running`);

    console.log(`${name} daemon starting...`);

    daemon = spawn(command, argsArray);
    let lastMessages = [];


    function onStdout(response) {
        const messages = response.toString().trim().split('\n');
        lastMessages = lastMessages.slice(-3).concat(messages);
        if (verbose)
            messages.map(msg => console.log(`${name}`, msg));
        if (typeof onMessage === 'function')
            messages.forEach(onMessage);
    }

    function onStderr(response) {
        const messages = response.toString().trim().split('\n');
        lastMessages = lastMessages.slice(-3).concat(messages);
        messages.map(msg => console.warn(`${name}`, msg));
        if (typeof onMessage === 'function')
            messages.forEach(onMessage);
    }

    daemon.stdout.on('data', onStdout);
    daemon.stderr.on('data', onStderr);

    return new Promise((resolve, reject) => daemon.on('exit', code => {
        daemon = null;
        let result = `${name} daemon exited with code ${code}`;

        if (code === 0) {
            console.log(result);
        } else {
            return reject(new Error(result));
        }

        resolve(lastMessages.slice(-1)[0]);
    }));
}
