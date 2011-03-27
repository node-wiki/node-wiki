var git = require('gitteh')
    path = require('path'),
    fs = require('fs'),
    logger = require('wiki/util/logging')

    default_source_settings = {
        branch: 'master',
        create_repos: true,
        insert_initial_data: true,
        bare_repo: true
    }

function get_default_source_settings(settings) {
    var local_settings = settings.source || default_source_settings

    local_settings.root = path.join('.', settings.hostname + '.git')

    local_settings.author = settings.author || {}

    return local_settings
}

function get_commit_author_data (settings) {
    var commit_data = {}

    commit_data.name = settings.source.author.name || 'Anonymous'
    commit_data.email = settings.source.author.email || settings.author_name + '@' + settings.hostname
    commit_data.time = new Date()

    return commit_data
}

function get_initial_template (filename, callback) {
    // First, verify that our file exists.
    fs.realpath(filename, function (err, filename) {
        if (err) throw err

        fs.readFile(filename, function get_template_file_contents(err, file_contents) {
            if (err) throw err

            callback(file_contents)
        })
    })
}

module.exports = {
    find: function find_file(callback, search_path, _settings) {
        var settings = _settings || {},
            attempted_create_repository = false,
            attempted_create_branch = false,
            repo, ref_location, ref_list

        settings.source = settings.source || get_default_source_settings(settings)
        settings.source.home_template = settings.source.home_template || 'templates/Home.md'

        function create_repository (callback) {
            git.initRepository(settings.source.root, true, function (err, _repo) {
                if (err) throw err

                // Set repo to our new repository.
                repo = _repo

                logger.log(logger.levels.INFO,
                            settings,
                            'Created new repository: ' +
                            settings.source.root)

                            // Finally, let's finally read that file.
                callback()
            })
        }

        /**
         * This is a sort of confusing piece. I should probably abstract it out
         * a bit, but basically we are looking for the `home_template`, getting
         * it's contents, and then copying them into the git repository for our
         * first commit.
         *
         * @TODO: The "home_template" mechanism is just limiting. We should just
         * get every file out of a specific directory and copy them over to the
         * repository one-by-one.
         */
        function insert_initial_data (callback) {
            var new_commit = repo.createCommit(),
                author_info = get_commit_author_data(settings),
                local_tree = repo.createTree(),
                blob = repo.createRawObject()

            new_commit.author = new_commit.committer = author_info
            new_commit.message = 'Initial data.'

            get_initial_template(settings.source.home_template, function (content) {
                var separator_index = settings.source.home_template.lastIndexOf('/'),
                    blob_filename = settings.source.home_template.slice(separator_index + 1)

                blob.data = new Buffer(content)
                blob.type = 'blob'
                blob.save()

                local_tree.addEntry(blob.id, blob_filename, 33188)
                local_tree.save(function check_tree_saved (err, status) {
                    if (err) throw err

                    new_commit.setTree(local_tree)
                    new_commit.save(function check_commit_saved (err, status) {
                        if (err) throw err

                        // Since our commit was successful, relate it to our branch.
                        repo.createOidReference(ref_location, new_commit.id, function (err, ref) {
                            if (err) throw err

                            logger.log(logger.levels.INFO,
                                        settings,
                                        'Initial data inserted for ' +
                                        settings.source.root)

                            // Finally, let's finally read that file.
                            callback()
                        })
                    })
                })
            })
        }

        /**
         * This function is called upon succesfully opening a repository in
         * order for us to ensure that our reference (aka branch) exists within
         * the repository. If it does not exist, then this will go ahead and
         * call insert_initial_data to insert any initial data required for this
         * branch.
         */
        function check_references (callback)
        {
            ref_location = 'refs/heads/' + settings.source.branch

            repo.listReferences(git.GIT_REF_LISTALL, function (err, refs) {
                if (err) throw err

                ref_list = refs.filter(function (ref_name) {
                    if (ref_name === ref_location) return true
                    return false
                })

                // If our ref_list is empty, then we don't have a ref to use.
                if (ref_list.length === 0)
                    insert_initial_data(callback)

                // 
                else
                    callback()
            })
        }

        /**
         * Once a repository has been succesfully verified, this goes ahead and
         * finds the requested file within our repository - or throws an error
         * if the file does not exist.
         */
        function search_repository () {
        }

        function open_repository () {
            git.openRepository(settings.source.root, function repo_opened(err, _repo) {
                if (err) {
                    if (!settings.source.create_repos || attempted_create_repository)
                    {
                        throw err
                    }
                    else
                    {
                        create_repository(function init_repository () {
                            check_references(search_repository)
                        })

                        return
                    }
                }

                search_repository()
            })
        }

        open_repository()
    },

    get: function get_file(callback, filename, _settings) {
        this.find(callback, filename, _settings)
    }
}
