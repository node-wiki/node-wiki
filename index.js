var http = require('http'),
    router = require('./router'),
    port_number = 80

http.createServer(router.factory()).listen(port_number)
