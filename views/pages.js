var markup = require('wiki/markup')

exports.view = function view (req, res) {
    var get_markup = function (err, output) {
        if (err)
        {
            console.log(err)
            return
        }

        res.writeHead(200, { 'Content-type': 'text/html' })
        res.end(output)
    }

    markup.render(get_markup, req.wiki.filename, req.wiki.settings)
}
