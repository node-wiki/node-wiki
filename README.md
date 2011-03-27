NodeWiki
========

What is it?
-----------

NodeWiki is a multi-site wiki system that uses git (by default) for storage. However, it *supports* any type of file storage through a driver backend. It also supports using markup on wiki pages via a driver-based backend that *currently* chooses it's driver based on the data source's provided file extension.

Features:
---------

* Easily extending any site with a wiki using included middleware
* Ability to host multiple wikis under different URLs with different settings
* Storing pages in multiple backends, including drivers for:
	* git *- depends on the [node-gitteh](https://github.com/libgit2/node-gitteh) [libgit2](http://libgit2.github.com/) bindings*
* Rendering of wiki pages with multiple markup formats, including drivers for:
	* markdown *- depends on [node-markdown](https://github.com/andris9/node-markdown)*

Usage:
------

Adding a wiki to your site is very easy. Here is an example of how to use it as connect middleware:

    var connect = require('connect'),
        wiki = require('wiki/middleware/connect'),
        server = connect.createServer()

    server.use(wiki())

    server.listen(8000)

As you can see, the only step needed to use a wiki is to import the proper module and pass it's return value to your server as middleware. You can optionally pass an object defining extra configuration settings to the function in order to customize your wiki. The different settings that can be used are documented on [the GitHub project's wiki pages](https://github.com/limpidtech/node-wiki "node-wiki documentation").

When you access the wiki by default, it will automatically create a new repository for you based on the hostname requested on the site. This means that you can point multiple DNS entries to the same running instance of node, and the wiki will automatically create repositories for any domain that is used to access the server. Since the default wiki uses git as a data source, this means that you will always need to make sure that the wiki has write access to it's working directory. By default, the wiki will by resolve requests to git repositories with the format "./hostname.git" - where {hostname} is the domain from which the request originated. This can be overridden (for all sources) by using the **settings.source.root** option.

Generally, it is best that you create a homepage for the wiki to use when a first request is made. Otherwise, you will not get any response from the wiki - even though the wiki got your request. This can be remedied very easily by creating a new directory in the directory called "templates" where your server is running. When someone comes to your wiki's homepage, they will first be taken to your "Home" file. So, create a file in your "templates" directory called "Home.md" and add the following text to it:

    Hello, world.

Now, go ahead and run your application through node. After running this code, you should have a server listening on port 8000. If your browser is on the same computer that you ran the code on, you can visit [http://localhost:8000/wiki/] and see that a new page exists. Otherwise, just visit http://your_machines_ip:8000/wiki/ in order to see your wiki. You should see a page that says "Hello, world." after requesting the homepage.

