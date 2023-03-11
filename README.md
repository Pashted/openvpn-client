# openvpn-client

High-level wrapper for OpenVPN Client application. Initializes an OpenVPN connection on Windows or Linux using *.ovpn configuration.

## Requirements

Install OpenVPN Client for [Windows](https://openvpn.net/community-downloads/) or [Linux](https://community.openvpn.net/openvpn/wiki/OpenVPN3Linux).

Set destination of bin directory into `PATH` env variable.

## Installation

```shell
npm i github:Pashted/openvpn-client#master
```

## Options

```javascript
const options = {
    path:    'openvpn', // path to the client executable. you can also use PATH env variable
    config:  './config.ovpn', // path to the openvpn config file
    verbose: false, // if true, shows all log messages in console
};
```

## Example

See [test.js](./test.js). May require admin privileges.

```shell
npm start
```

## Links

* OpenVPN [docs](https://openvpn.net/community-resources/#documentation).
* [Reference manual](https://openvpn.net/community-resources/reference-manual-for-openvpn-2-6/) for OpenVPN 2.6
