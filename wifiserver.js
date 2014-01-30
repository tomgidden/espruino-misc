var wlan = require('CC3000').connect();

wlan.connect("ssid", "passphrase", function (s) {
    if(s == 'dhcp') {
        console.log(wlan.getIP().ip);

        require('http')
            .createServer(function(req, res) {
                res.writeHead(200);
                res.end("Hello");
            })
            .listen(8080);
    }
});
