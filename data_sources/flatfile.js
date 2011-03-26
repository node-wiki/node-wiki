var fs = require('fs')

module.exports = {
    /**
     * Finding paths in NodeJS is a freakin' mess... But there is probably a
     * better way to do this.
     */
    find: function find_file (callback, search_path, _settings) {
        var path_separator = '/',
            settings = _settings || {},
            source_settings = settings.source || {
                root: ['.', settings.hostname].join(path_separator)
            },

            search_filename = search_path,
            sep_index = search_path.lastIndexOf(path_separator),
            search_dirname = undefined

        if (sep_index > -1)
        {
            search_dirname = search_filename.slice(0, sep_index)
            search_filename = search_filename.slice(sep_index + 1)
        }

        // First we need to get the absoluet path to our root directory
        fs.realpath(source_settings.root, function get_realpath(err, absolute_root) {
            if (err) {
                callback(err)
                return
            }

            var full_search_path = [
                absolute_root,
                search_dirname
            ].join(path_separator)

            // Next, we need to verify that the requested path isn't above the root
            fs.realpath(full_search_path,
                        function cfs (err, absolute_search_path) {

                if (err) {
                    callback(err)
                    return
                }

                // This will only be true if our path is within our root
                if (absolute_search_path.indexOf(absolute_root) !== 0)
                {
                    // @TODO: Use a real error here.
                    callback('The provided path is potentially insecure.')
                    return
                }

                // Now, we can see if any matching files exist within this path.
                fs.readdir(absolute_search_path, function (err, files) {
                    if (err)
                    {
                        callback(err)
                        return
                    }

                    for (file in files)
                    {
                        var filename = files[file],
                            extension_index = filename.lastIndexOf('.'),
                            file_basename = filename

                        if (extension_index > -1)
                            file_basename = filename.slice(0, extension_index)

                        // @TODO: Can we support passing the file extension?
                        if (file_basename === search_filename)
                        {
                            callback(err, [
                                absolute_search_path,
                                filename
                            ].join(path_separator))

                            return
                        }
                    }

                    // @TODO: Use a real error here.
                    callback('File not found.')
                })
            })

        })
    },

    get: function get_file (callback, filename, _settings) {
        var settings = _settings || {},
            find_success = function find_success (err, filename) {
            if (err)
            {
                callback(err)
            }

            fs.readFile(filename, function get_file_contents(err, data) {
                if (err)
                {
                    callback(err)
                    return
                }

                callback(err, [
                            data.toString('utf-8'),
                            filename.slice(filename.lastIndexOf('.') + 1)
                        ])
            })
        }

        this.find(find_success, filename, settings)
    }
}
