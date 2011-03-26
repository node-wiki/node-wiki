/***
 * Attempts to find an attribute in our data sources that contains a list with
 * the given name.
 */
exports.get_by_name = function get_source_by_name (name, data_sources) {

    // Given a single particular source, this one returns true if it equals name
    var find_in_source = function find_in_source (item) {
        if (item == name)
            return true

        return false
    }

    for (source in data_sources)
    {
        if (data_sources[source].filter(find_in_source).length > 0)
            return source;
    }

    return false;
}
