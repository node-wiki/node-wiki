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
        var path_separator = path.join('a', 'b')[1], // Please add this to node, Ryah ;)
            settings = _settings || {},
            attempted_create_repository = false,
            attempted_create_branch = false,
            git_directory_attr = 16384,
            repo, ref_location, ref_list

        settings.source = settings.source || get_default_source_settings(settings)
        settings.source.home_template = settings.source.home_template || 'templates/Home.md'

        ref_location = path.join('refs', 'heads', settings.source.branch)

        function create_repository (callback) {
            git.initRepository(settings.source.root, true, function (err, _repo) {
                if (err) throw err

                // Set repo to our new repository.
                repo = _repo

                logger.log(logger.levels.INFO,
                            settings,
                            'Created new repository: ' +
                            settings.source.root)

                // Finally, let's read that file.
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
         * Once the tree has been iterated and we have found the proper entry,
         * this will be used to convert the filename into our final output for
         * the passing to the callback provided to find_file.
         */
        function handle_matching_entry (entry)
        {
            if (entry.attributes == git_directory_attr)
            {
                throw 'Currently, finding directories is not supported with git.'
            }
            else
            {
                var extension_index = entry.filename.lastIndexOf('.'),
                    file_basename = entry.filename.slice(0, extension_index),
                    file_extension = entry.filename.slice(extension_index+1)

                repo.getRawObject(entry.id, function (err, raw_object) {
                    if (err) throw err

                    // Finally... Success.
                    callback(0, [
                        raw_object.data.toString('utf-8'),
                        file_extension
                    ])
                })
            }
        }

        /**
         * This is the part of the searching system that iterates recursively
         * through the tree until we've found our search item.
         */
        function iterate_tree (tree, search_list) {
            for (var i=0; i < tree.entryCount; i++)
            {
                /**
                 * We've used a callback factory here in order to prevent any
                 * collisions in other searches that might be happening in
                 * serial with this one. The factory provides a closure that
                 * we can use to separate the global search list from this,
                 * one and therefore every iteration will only work on it's
                 * proper search list.
                 */

                tree.getEntry(i, (function get_entry_factory (search_list) {
                    return function get_entry (err, entry) {
                        if (err) throw err
    
                        if (search_list.length < 1)
                            throw ([search_path,
                                    'not found in ',
                                    settings.source.root].join(' '))
    
                        // First, check if this entry is relevant.
                        if (entry.filename.indexOf(search_list[0]) === 0)
                        {
                            // Now, specific logic for trees or files.
                            if (entry.attributes == git_directory_attr
                                && entry.filename == search_list[0])
                            {
                                search_list.shift()

                                if (search_list.length === 0)
                                {
                                    handle_matching_entry(entry)
                                }
                                else
                                {
                                    repo.getTree(entry.id, function get_next_tree(err, tree) {
                                        if (err) throw err

                                        iterate_tree(tree, search_list)
                                    })
                                }
                            }
                            else if (entry.attributes != git_directory_attr
                                     && search_list.length === 1)
                            {
                                handle_matching_entry(entry)
                            }
                        }
                    }

                })(search_list))
            }
        }

        /**
         * Once a repository has been succesfully verified, this goes ahead and
         * finds the requested file within our repository - or throws an error
         * if the file does not exist.
         */
        function search_repository () {
            // Get our reference to the requested branch
            repo.getReference(ref_location, function reference_getter (err, ref) {
                if (err) throw err

                // Next get the target commit for the requested branch
                repo.getCommit(ref.target, function target_getter (err, target) {
                  if (err) throw err

                    // Next, get this commit's tree
                    target.getTree(function tree_getter(err, tree) {
                        if (err) throw err

                        iterate_tree(tree, search_path.split(path_separator))
                    })
                })
            })
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

                repo = _repo

                search_repository()
            })
        }

        open_repository()
    },

    get: function get_file(callback, filename, _settings) {
        this.find(callback, filename, _settings)
    }
}
