var currentDirectory = {'Left':null, 'Right':null};
var baseFolder = {'Left':null, 'Right':null};
var selectedEntry = {'Left':'', 'Right':''};
var selectedSide;
var clipboard = { 'entry': null, 'action': null};
var fsServices = {'Left':null, 'Right':null};
var fsMap = {'Left':null, 'Right':null};
var waitCounter = 0;
var directoryCounter = 0;

$(document).ready(function(){
    $('#selectFilesystemLeft').bind('click', function(){ callExplorer('Left') });
    $('#selectFilesystemRight').bind('click', function(){ callExplorer('Right') });
    $('#configuration').bind('click', function(){ callServiceConfiguration('Right') });
    injectWebinos();
});

function injectWebinos() {
    if (window.WebSocket || window.MozWebSocket || WebinosSocket) {
        var head = document.getElementsByTagName('head')[0];
        var oScript = document.createElement('script');
        oScript.type = 'text/javascript';
        oScript.src = '/webinos.js';
        // most browsers
        oScript.onload = load;
        // IE 6 & 7
        oScript.onreadystatechange = function () {
            if (this.readyState == 'complete') {
                load();
            }
        }
        head.appendChild(oScript);
    } else {
        console.log('Waiting for WebSocket..');
        setTimeout(injectWebinos, 100);
    }
}

function load() { }

function callExplorer(side) {
    webinos.dashboard
        .open({
                module: 'explorer'
              , data: { service:'http://webinos.org/api/file' }
            }
          , function(){ console.log("***Dashboard opened on " + side + " side");} )
                .onAction( function (data) { fsDiscovery(data.result[0], side); } );
}

function callServiceConfiguration() {
    webinos.dashboard
        .open({
                module: 'serviceConfiguration'
              , data: 'http://webinos.org/api/file'
            }
          , function(){ })
                .onAction(function(){alert("done")});
}

function callServiceSharing() {
    webinos.dashboard
        .open(
            {
                module: 'serviceSharing'
              , data: {
                    apiURI: 'http://webinos.org/api/file'
                  , params: {
                        local: {
                            shares: [
                                {   name: 'data'
                                ,   path: '/mnt/data'
                                }
                              , {   name: 'home'
                                ,   path: '/home/peter'
                                }
                            ]
                        }
                    }
                }
            }
          , function(){ })
                .onAction(function(){alert("done")});
}

function error(error) {
    alert('Error: ' + error.message + ' (Code: #' + error.code + ')');
}

function fsDiscovery(serviceFilter, side){
    webinos.discovery.findServices(
        new ServiceType('http://webinos.org/api/file')
      , {
            onFound: function(service){
                if ((service.id === serviceFilter.id) && (service.address === serviceFilter.serviceAddress)) {
                    fsFound(service, side)
                }
            }
          , onError: error
        }
    );
}

function fsFound(service, side) {
    fsServices[side] = service;

    baseFolder[side] = service.description.split(": ");
    service.bindService({
        onBind:function () {
            service.requestFileSystem(
                1
              , 1024
              , function (filesystem) {
                    loadDirectory(filesystem.root, side);
                    console.log(filesystem.root);
                }
              , function (error) {
                    alert('Error requesting filesystem (#' + error.code + ')');
                }
            );
        }
      , onError:function(){
            baseFolder[side] = [];
        }
    });
}

function loadDirectory(directory, side) {
    $('#listviewPanel' + side).empty();
    fsMap[side] = new Object();
    $('#labelPath' + side).text(baseFolder[side][0] + ((directory.fullPath=='/') ? '' : directory.fullPath));

    $('#labelPath' + side).on('taphold', function (e) {
        $('.popupMenuFFHeader').html('In ' + e.currentTarget.innerText + ' :');
        clipboard.entry == null ? $('#pasteDirFF').addClass('ui-disabled') : $('#pasteDirFF').removeClass('ui-disabled');
        e.stopPropagation();
        $('#popupMenuLinkFF').click();
//        $('#popupCreateFileOK')[0].href = 'javascript:createFile($('#filename').val(),''+side+'');';
//        $('#popupCreateFolderOK')[0].href = 'javascript:createDirectory($('#foldername').val(),''+side+'');';
    });

    directory.getParent(
        function (parent) {

            var content = $('#parentTemplate').tmpl({
                parentID:'parent' + side
              , parentName: '..' /* ((directory.fullPath == '/') ? '.' : '..')*/
            });
            $('#listviewPanel' + side).append(content);

            if (directory.fullPath != '/'){
                $('#parent' + side).click(loadDirectory.bind(this, parent, side));
            }
        }
    );

    var reader = directory.createReader();

    var successCallback = function (entries) {
        currentDirectory[side] = directory;
        var i = 0;
        entries.forEach(
            function (entry) {
                var entryType = ((entry.isDirectory == true) ? 'folder' : 'file');
                var content = $('#entryTemplate').tmpl({
                        entryID:'entry' + side + (++i),
                        entryClass: entryType,
                        entryName: entry.name,
                        entryIcon: 'images/' + entryType + '.png',
                    }
                );
                $('#listviewPanel' + side).append(content);
                fsMap[side]['entry' + side + i] = entry;
                if (entry.isDirectory == true) {
                    $('#entry' + side + i).click(loadDirectory.bind(this, entry, side));
                }
            }
        );


        $('#listviewPanel' + side).append('<li class="emptyli" id="emptyli' + side + '" style="height: 100px"></li>');
        $('#listviewPanel' + side).listview('refresh');

        $('.emptyli').on('taphold', function (e) {
            $('.popupMenuFFHeader').html('In ' + directory.filesystem.name + ' :');
            selectedSide = e.currentTarget.id.indexOf('Left') != -1 ? 'Left' : 'Right';
            selectedEntry[selectedSide] = directory;
            clipboard.entry == null ? $('#pasteDirFF').addClass('ui-disabled') : $('#pasteDirFF').removeClass('ui-disabled');
            e.stopPropagation();
            $('#popupMenuLinkFF').click();
        });

        $('.folder').on('taphold', function (e) {
            $('.popupMenuFolderHeader').html(e.currentTarget.text);
            selectedSide = e.currentTarget.id.indexOf('Left') != -1 ? 'Left' : 'Right';
            selectedEntry[selectedSide] = e.currentTarget.id;
            clipboard.entry == null ? $('#pasteDir').addClass('ui-disabled') : $('#pasteDir').removeClass('ui-disabled');
            e.stopPropagation();
            $('#popupMenuLinkFolder').click();
        });

        $('.file').on('taphold', function (e) {
            $('.popupMenuFileHeader').html(e.currentTarget.text);
            //~ selectedEntry[side] = baseFolder[side][1] + ((currentDirectory[side].fullPath=='/')?'':currentDirectory[side].fullPath) + e.currentTarget.text;
            selectedSide = e.currentTarget.id.indexOf('Left') != -1 ? 'Left' : 'Right';
            selectedEntry[selectedSide] = e.currentTarget.id;

            clipboard.entry == null ? $('#paste').addClass('ui-disabled') : $('#paste').removeClass('ui-disabled');
            e.stopPropagation();
            $('#popupMenuLinkFile').click();
        });
    };

    var errorCallback = function (error) {
        var content = $('#parentTemplate').tmpl({
            parentID:'parent' + side, parentName:'..'
        });
        $('#listviewPanel' + side).append(content);
        $('#parent' + side).click(loadDirectory.bind(this, currentDirectory[side], side));

        $('#listviewPanel' + side).append('<li></li>');
        $('#listviewPanel' + side).listview('refresh');
    };

    reader.readEntries(successCallback, errorCallback);
}

function copy() {
   console.log("--------- COPY COPY COPY ---------");
   console.log(fsMap[selectedSide][selectedEntry[selectedSide]]);
   clipboard.side = selectedSide;
   clipboard.entry = fsMap[selectedSide][selectedEntry[selectedSide]];
   clipboard.action = 'copy';
   console.log(webinos);
}

function cut() {
   console.log("--------- CUT CUT CUT ---------");
   clipboard.side = selectedSide;
   clipboard.entry = fsMap[selectedSide][selectedEntry[selectedSide]];
   clipboard.action = 'cut';
}

function paste() {
   console.log("--------- PASTE PASTE PASTE ---------");

   var destinationDir = currentDirectory[selectedSide];

   if(!selectedEntry[selectedSide].isDirectory)
      if(fsMap[selectedSide][selectedEntry[selectedSide]].isDirectory)
         destinationDir = fsMap[selectedSide][selectedEntry[selectedSide]];

   if(clipboard.entry.isDirectory)
   {
      copyDirectory(destinationDir, clipboard.entry, function(){});
   }
   else{
      copyFile(destinationDir, clipboard.entry, function(){});
   }
}

function deleteEntry() {
   side = selectedSide;
   entry = fsMap[selectedSide][selectedEntry[selectedSide]];

   if(entry.isDirectory){
      entry.removeRecursively(function(){
         loadDirectory(currentDirectory[side], side);
      }, function(){console.error("Unexpected error: impossible to remove" + entry.name)});
   }
   else {
      entry.remove(function(){
         loadDirectory(currentDirectory[side], side);
      }, function(){console.error("Unexpected error: impossible to remove" + entry.name)});
   }
}

function createDirectory(name, side, successCB) {
   currentDirectory[side].getDirectory(name,
      {create:true, exclusive:true},
      function (entry) {
         successCB(entry);
      },
      function () {
         alert('Error while creating the directory')
      }
   );
   loadDirectory(currentDirectory[side], side);
}



function copyDirectory(parentDirectory, copyingDirectory, successCB) {
   var dirReader = copyingDirectory.createReader();
   dirReader.readEntries(function(entriesList){
      startCopy();
      parentDirectory.getDirectory(copyingDirectory.name,
         {create:true, exclusive:true},
         function (newDirectory) {
            for(var i=0; i<entriesList.length; i++)
            {
               directoryCounter++;
               if(entriesList[i].isDirectory) {
                  copyDirectory(newDirectory, entriesList[i], dirCB);
               }
               else {
                  copyFile(newDirectory, entriesList[i], dirCB);
               }
            }

         });
      },
      function () {
         alert('Error while creating the directory')
      }
   );

   function dirCB(){
      directoryCounter--;
      if(directoryCounter == 0){
         finishedCopy();
         if(typeof successCB == "function") successCB();
      }
   }
}

function copyFile(parentDirectory, copyingFile, successCB) {
   parentDirectory.getFile(copyingFile.name,
      {create:true, exclusive:true},
      function (newEntry){
         startCopy();
         newEntry.createWriter(function (writer){
            writer.onwriteend = function(evt){
               console.log(evt);
               finishedCopy();
               if(typeof successCB == "function")successCB();
            };
            copyingFile.file(function(data){
               writer.write(data);
            }, function(error){console.error('READ FILE ERROR: '); console.error(error);});
         }, function(error){console.error('WRITE FILE ERROR: '); console.error(error);});
      }, function(error){console.error('CREATE FILE ERROR: '); console.error(error);},
      function () {
         alert('Error while creating the file')
      }
   );
}

function createFile(name, side, successCB) {
   console.error(name);
   currentDirectory[side].getFile(name,
      {create:true, exclusive:true},
      function (entry) {
         if(typeof successCB == "function")successCB(entry);
      },
      function (err) {
         alert('Error while creating the file');
         console.error(err);
      }
   );
   loadDirectory(currentDirectory[side], side);
}

function startCopy(){
   if (waitCounter == 0)
   {
      $("#loadingPopup").popup("open");
   }
   waitCounter++;
}

function finishedCopy(){
   waitCounter = waitCounter == 0 ? 0 : waitCounter-1;

   console.debug("WAIT COUNTER: " + waitCounter);

   if (waitCounter == 0)
   {
      $("#loadingPopup").popup("close");

      if (clipboard.action == "cut"){
         var entry = clipboard.entry;
         if(entry.isDirectory){
            entry.removeRecursively(function(){
            loadDirectory(currentDirectory[clipboard.side], clipboard.side);
            clipboard.side = clipboard.entry = clipboard.action = null;
            }, function(){console.error("Unexpected error: impossible to remove" + entry.name)});
         }
         else {
            entry.remove(function(){
               loadDirectory(currentDirectory[clipboard.side], clipboard.side);
               clipboard.side = clipboard.entry = clipboard.action = null;
            }, function(){console.error("Unexpected error: impossible to remove" + entry.name)});
         }
      }
      else{
         clipboard.side = clipboard.entry = clipboard.action = null;
      }
      loadDirectory(currentDirectory[selectedSide], selectedSide)
   }
}


function openCreateFolderPopup(side){
   if(currentDirectory[side]){
      $("#popupCreateFolder").popup("open");
      selectedSide = side;
   }
}

function refresh(side){
   if (currentDirectory[side])
      loadDirectory(currentDirectory[side], side);
}

