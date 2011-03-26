/**
 * A factory that is used in order to provide settings to our middleware
 * function.
 */
module.exports = function connect_factory(settings, prefix) {
    /**
     * A middleware function that can be used to add the wiki to any 'connect'
     * service that you'd like.
     */
    var router = require('wiki/router').factory(settings, prefix),
        connect_middleware = function connect_middleware(req, res, next) {
            if (router(req, res) === false)
                next()
        }

    return connect_middleware
}
