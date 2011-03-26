var default_sources = require('wiki/data_sources/defaults'),
    default_markup_formats = require('wiki/markup/defaults')
    
module.exports = {
    get_by_name: function get_filter_by_name(name, settings) {
        var markup_formats = settings.markup_formats || default_markup_formats

        return require(markup_formats[name])
    },

    render: function render_markup (callback, filename, settings)
    {
        var data_source = settings.data_source || default_sources._default,
            markup_formats = settings.markup_formats || default_markup_formats,

            render_file = function render_file (err, file_data) {
                var markup_filter, markup_result

                if (err)
                {
                    callback(err)
                    return
                }

                markup_filter = module.exports.get_by_name(file_data[1], settings)
                markup_result = markup_filter(file_data[0])

                callback(err, markup_result)
            }

        // Case string sources into modules
        if (typeof data_source == 'string')
            data_source = require(data_source)

        data_source.get(render_file, filename, settings)
    }
}
