# Releases

Releasing process is entirely manual (for the moment) and is based on [Semantic Versioning](http://semver.org/):

* Make sure all the dependencies are up-to-date.
* Clean your working changes with a commit or a stash.
* Update the `Stable Tag` entry in [readme.txt](readme.txt) and the `Version` entry in [46cl-custom-fields.php](46cl-custom-fields.php).
* Commit the changements with the message `Release vX.X.X` where `X.X.X` is your release number.
* Add a tag to this commit, name it `vX.X.X`.
* Push your commits __and__ your tags.
* Create an archive for the current release by running the following command in the project root: `zip -r 46cl-custom-fields.zip ./ --exclude="*.git*" --exclude="*.DS_Store*"`
* [Create a new release](https://github.com/46cl/wp-custom-fields/releases/new) associated to your new tag and attach the previously created archive.
