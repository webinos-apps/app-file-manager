var currentDirectory = {'Left':null, 'Right':null};
var baseFolder = {'Left':null, 'Right':null};
var selectedEntry = {'Left':'', 'Right':''};
var fsServices = {'Left':null, 'Right':null};

$(document).ready(injectWebinos);

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
                module: 'explorer',
                data: { service:'http://webinos.org/api/file' }
              }
            , function(){ console.log("***Dashboard opened on " + side + " side");} )
              .onAction( function (data) { fsDiscovery(data.result, side); } );
}


function error(error) {
    alert('Error: ' + error.message + ' (Code: #' + error.code + ')');
}

function fsDiscovery(serviceFilter, side){
    webinos.discovery.findServices(
        new ServiceType('http://webinos.org/api/file')
      , {
            onFound: function(service){ if (service.id === serviceFilter.id) fsFound(service, side) }
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
    $('#labelPath' + side).text(baseFolder[side][0] + ((directory.fullPath=='/') ? '' : directory.fullPath));

    $('#labelPath' + side).on('taphold', function (e) {
        $('.popupMenuFFHeader').html('In ' + e.currentTarget.innerText + ' :');
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
                        entryID:'entry' + side + (++i), entryClass:entryType, entryName:entry.name, entryIcon:'images/' + entryType + '.png'
                    }
                );
                $('#listviewPanel' + side).append(content);
                if (entry.isDirectory == true) {
                    $('#entry' + side + i).click(loadDirectory.bind(this, entry, side));
                }
            }
        );

        $('#listviewPanel' + side).append('<li></li>');
        $('#listviewPanel' + side).listview('refresh');

        $('.folder').on('taphold', function (e) {
            $('.popupMenuFolderHeader').html(e.currentTarget.text);
            selectedEntry[side] = baseFolder[side][1] + ((currentDirectory[side].fullPath=='/')?'':currentDirectory[side].fullPath) + '/' + e.currentTarget.text;
            e.stopPropagation();
            $('#popupMenuLinkFolder').click();
        });

        $('.file').on('taphold', function (e) {
            $('.popupMenuFileHeader').html(e.currentTarget.text);
            selectedEntry[side] = baseFolder[side][1] + ((currentDirectory[side].fullPath=='/')?'':currentDirectory[side].fullPath) + '/' + e.currentTarget.text;
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

function createDirectory(name, side) {
    currentDirectory[side].getDirectory(name,
        {create:true, exclusive:true},
        function (entry) {
            alert('Directory ' + entry.name + ' was successfully created')
        },
        function () {
            alert('Error while creating the directory')
        }
    );
    loadDirectory(currentDirectory[side], side);
}

function createFile(name, side) {
    currentDirectory[side].getFile(name,
        {create:true, exclusive:true},
        function (entry) {
            alert('File ' + entry.name + ' was successfully created')
        },
        function () {
            alert('Error while creating the file')
        }
    );
    loadDirectory(currentDirectory[side], side);
}
