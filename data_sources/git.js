var git = require('nodegit').raw, // The raw API seems to be needed for now.
    path = require('path'),
    default_source_settings = {
        branch: 'master',
        create_repos: true,
        create_branches: true, // This is always true when
        bare_repo: true
    }

function get_default_source_settings(settings) {
    var path_separator = '/',
        local_settings = settings.source || default_source_settings

    local_settings.root = ['.', settings.hostname + '.git'].join(path_separator)

    return local_settings
}

module.exports = {
    find: function find_file(callback, search_path, _settings) {
            settings = _settings || {}

        settings.source = settings.source || get_default_source_settings(settings)

        var repo = new git.Repo(),
            attempted_new_repo = false,
            attempted_new_branch = false

        /**
         * This is called when we are needing to create a new repository upon
         * failure to open one.
         */
        function create_repo(callback)
        {
            repo.init(settings.source.root, settings.source.bare_repo, function (err) {
                attempted_new_repo = true

                if (err) throw new git.Error().strError(err)

                console.log('Created new repository at ' + settings.source.root)

                callback()
            })
        }

        function create_branches (callback) {
            // @TODO: Implement branch creation.
            attempted_new_branch = true

            callback()
        }

        function open_branches () {
            var ref_branch = new git.Ref(repo),
                ref_location = 'refs/heads/' + settings.source.branch

            ref_branch.lookup(repo, ref_location, function (err) {
                console.log('Uno.')

                // TODO: Create a branch.
                if (err)
                {
                    if (attempted_new_branch || !settings.source.create_branches)
                    {
                        throw new git.Error().strError(err)
                    }
                    else
                    {
                        create_branches(open_branches)
                        return
                    }
                }

                console.log('On branch: ' + settings.source.branch)
            })
        }

        function open_repo()
        {
            repo.open(settings.source.root, function (err) {
                if (err)
                {
                    /**
                     * If we have already tried or have been asked not to create
                     * new repositories for new hostnames - then we throw an
                     * error. Otherwise, we will move on to creating a new
                     * repository.
                     */
                    if (attempted_new_repo || !settings.source.create_repos)
                    {
                       throw new git.Error().strError(err)
                    }
                    else
                    {
                        create_repo(open_repo)
                        return // Upon success, create_repo() will reopen.
                    }
                }

                open_branches()
            })
        }

        open_repo()
    },

    get: function get_file(callback, filename, _settings) {
        this.find(callback, filename, _settings)
    }
}
