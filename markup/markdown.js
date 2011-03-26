/***
 * Translates the provided data into HTML using the markdown format.
 *
 * @TODO: Add support for 'discount' once it actually builds.
 */

module.exports = function render_markdown (data) {
    var markdown = require('markdown')

    return markdown.parse(data)
}
