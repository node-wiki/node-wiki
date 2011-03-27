Change List
===========

0.0.01-prototype
----------------
* Added a data source using git as a backend instead of the previous flat file support.
* Completely removed support for flat-file repositories.
* Added an (untested) generic application in index.js for running standalone
* Added another module for using the wiki as stack middleware by aliasing connect's middleware.

0.0.0-prototype
---------------

* Initial prototype.
* Provided a basic inteface for configuration through a settings object.
* Implemented a wrapper for interfacing with multiple markup languages, as well as driver for:
	- markdown (via `npm install markdown`)
* Implemented a basic interface for letting the wiki use flat files.
	- flat files will be deprecated as soon as possible
* Implemented a view for reading files on the wiki.
	- Files are converted automatically by searching a data source and rendering with markup
* Implemented a basic wrapper allowing the wiki's router to be accessed as connect middleware

