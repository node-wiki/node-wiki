var util = require('util')

module.exports = {

    // We default these with large intervals in effort to use custom levels
    levels: {
        DEBUG: -1,
        INFO: 0,
        WARN: 90,
        ERROR: 100
    },

    prefix: 'wiki',

    log: function log(level, _settings) {
        var settings = _settings || {}

        settings.log = settings.log || {}

        settings.log.level = settings.log.level || this.levels.INFO,
        settings.log.prefix = settings.log.prefix || this.prefix

        if (settings.log.verbose || level >= settings.log.level)
        {
            util.puts([settings.log.prefix, arguments[2]].join(': '))
        }
    }
}
