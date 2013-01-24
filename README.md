
<!--
This file is part of webinos platform.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

(C) Copyright 2012, 

Author Davide Patti, Salvatore Monteleone
-->

## Project home of the webinos FileManager demo

<!--
The layout of this project folder is as follows:

        |
        +-- apps                       -> apps, both host and guest
        |
        +-- docs                       -> documentation, incl generated figures
        |
        +-- library                    -> content
        |
        +-- README.md                  -> this file
-->

### Installing

The FileManager depends on the webinos platform, requiring a set of APIs in order to perform file manipulation, 
accessing/sharing contacts, showing notifications and retriving context/device/geolocation data. Thus, the following APIs are required:

* http://www.w3.org/TR/FileAPI/
* http://www.w3.org/TR/file-system-api/
* http://www.w3.org/TR/file-writer-api/
* http://dev.webinos.org/specifications/api/contacts.html
* http://dev.webinos.org/specifications/api/notifications.html
* http://dev.webinos.org/specifications/api/context.html
* http://dev.webinos.org/specifications/api/devicestatus.html
* http://www.w3.org/TR/geolocation-API/
 
To use FileManager first install the webinos platform then install FileManager in *<WEBINOS_PLATORM>/webinos/web_root*.

### Running

In order to run FileManager, the client must be opened in a recent version of firefox, safari, chrome or chromium at 
at `http://localhost:8080/apps/app-file-manager/index.html`. 

Check out [jira for FileManager](http://jira.webinos.org/browse/APPFM) for a complete overview of the product backlog, plans for new features or for issueing bugs.

For details on the implementation please refer to the docs.

### Usage

The FileManager app can be run on devices belonging to multiple domains (mobiles, PC desktop, TV screen and automotive devices) 
allowing users to browse, open and share their file accross different users and devices.
While supporting common file management operations (rename, copy, move..), it adds some "enhanced"  features:

* Selectively sharing data among personal devices and users. 
* Setting the proper access control properties on each single file/directory
* Automatically synchronize files shared using a cloud based mechanism

Using FileManager an user can choose a file/directory to be set as "visible" from other users belonging to different personal
zones. Updated copies of the files are maintained in a shared space of user's Personal Zone Hub,  and appropriate notifications are sent to the personal zone hubs of some selected users.
FileManager periodically checks on user's personal hub if any file has been shared and/or updated by other users, so that a syncronized set of shared files and directory is available on the cloud.

### Documentation

<!--
Building the documentation requires [PlantUML](http://plantuml.sourceforge.net/), [jsdoc-toolkit](https://code.google.com/p/jsdoc-toolkit/) and [markdown](http://daringfireball.net/projects/markdown/).

#### Building documentation on OSX

1. Download and install [PlantUML](http://plantuml.sourceforge.net/)
2. Create a script to execute PlantUML and add it to your path. Or you can use [this example script](https://gist.github.com/4502562)
3. Install jsdoc-toolkit using [Homebrew](http://mxcl.github.com/homebrew/): *brew install jsdoc-toolkit*
4. Install markdown using [Homebrew](http://mxcl.github.com/homebrew/): *brew install markdown*
-->

### Acknowledgements
