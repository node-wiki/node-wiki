var default_data_sources = require('wiki/data_sources'),
    pages = {
        view: require('wiki/views/pages').view,
        edit: require('wiki/views/pages').edit
    }

module.exports.factory = function router_factory (_settings, prefix) {
    var settings = _settings || {}

    var router = function router (req, res, next) {
        var host_aliases = settings.host_aliases || {'127.0.0.1': 'localhost'},
            hostname = req.headers.host.split(':')[0],
            hostname = host_aliases[hostname] || hostname,
            base_uri = settings.base_uri || '/wiki/',
            data_sources = settings.data_sources || default_data_sources,
            data_source = settings.source || data_sources._default

        if (req.url.indexOf(base_uri) === 0)
        {
            settings.hostname = hostname

            req.wiki = {
                filename: req.url.slice(base_uri.length),
                settings: settings
            }

            pages.view(req, res)

            return true
        }

        return false
    }

    return router
}
