var fsServices = {};
var er;

$(document).ready(load);


function load() {

    function serviceFoundCB(service) {
        var option = $('<option>');
        option.attr('value', service.id);
        option.text(service.serviceAddress);
        fsServices[service.id] = service;

        $('#selectFileSystemLeft').append(option.clone());        
        $('#selectFileSystemRight').append(option.clone());
    }
    
    function serviceLostCB(service) {
        fsServices[service.id] = NULL;
        
        var option = $('#selectFileSystemLeft[value="' + service.id + '"]');
        option.remove();
        
        option = $('#selectFileSystemRight[value="' + service.id + '"]');
        option.remove();
    }
    
    function error(error) {
        alert("Error: " + error.message + " (Code: #" + error.code + ")");
    }

    webinos.discovery.findServices(
        new ServiceType("http://webinos.org/api/file")
        ,{
             onFound: serviceFoundCB
            ,onLost: serviceLostCB
            ,onError: error
        }
    );
}

function loadFileSystem(serviceId, side) {
    var service = fsServices[serviceId];

    service.bindService({
        onBind: function () {
            service.requestFileSystem(
                 1
                ,1024
                ,function (filesystem) {
                    loadDirectory(filesystem.root, side);
                    console.log(filesystem.root);
                }
                ,function (error) {
                    alert("Error requesting filesystem (#" + error.code + ")");
                }
            );
        }
    });
}

function loadDirectory(directory, side)
{
    $('#listviewPanel' + side).empty();
    $('#labelPath' + side).text(directory.fullPath);

    directory.getParent(
        function (parent) {
            var content =  $("#parentTemplate").tmpl({
                parentID: "parent" + side
                ,parentName: ((directory.fullPath=="/") ? "." : "..")
            });
            $('#listviewPanel' + side).append(content);
            $('#parent' + side).click(loadDirectory.bind(this, parent, side));
        
        }
    );

    var reader = directory.createReader();

    var successCallback = function(entries) {
        var i = 0;
        entries.forEach(
            function (entry) {
                var entryType = ((entry.isDirectory==true) ? 'folder' : 'file');
                var content = $("#entryTemplate").tmpl({
                        entryID: "entry" + side + (++i)
                        ,entryClass: entryType
                        ,entryName: entry.name
                        ,entryIcon: 'images/' + entryType + '.png'
                    }
                );
                $('#listviewPanel' + side).append(content);
                if (entry.isDirectory==true) {
                    $('#entry' + side + i).click(loadDirectory.bind(this, entry, side));
                }
            }
        );

        $('#listviewPanel' + side).append("<li></li>");
        $('#listviewPanel' + side).listview('refresh');

        $('.folder').on("taphold", function(e) {
            $('.popupMenuHeader').html(e.currentTarget.text);
            e.stopPropagation();
            $('#popupMenuLinkFolder').click();
        });

        $('.file').on("taphold", function(e) {
            $('.popupMenuHeader').html(e.currentTarget.text);
            e.stopPropagation();
            $('#popupMenuLinkFile').click();
        });
    };

    var errorCallback = function (error) {
        alert("Error reading directory (#" + error.name + ")");
    };

    reader.readEntries(successCallback, errorCallback);
}
