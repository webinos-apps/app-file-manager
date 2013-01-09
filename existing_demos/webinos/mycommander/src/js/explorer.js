
var path = webinos.path || (webinos.path = {});
var file = webinos.file || (webinos.file = {});

var FileObject = function (explorer, entry) {
	this.explorer = explorer;
	this.entry = entry;
};

FileObject.prototype.row = null;

var FileObjectList = function() {
	this.objects = new Array();
};

FileObjectList.prototype.insert = function(fo) {
	// check if fileObject with the same name exists
	var foToDel = null;
	
	for (var i = 0; i < this.objects.length; i++) {
		if (this.objects[i].entry.fullPath == fo.entry.fullPath) {
			foToDel = this.objects[i]; 
		}
	}
	
	if (foToDel) {
		this.remove(foToDel);
	}
	
	this.objects.push(fo);
	
	this.objects.sort(function (fo1, fo2) {
		if (fo1.entry.fullPath < fo2.entry.fullPath)
			return -1;
		else if (fo1.entry.fullPath == fo2.entry.fullPath)
			return 0;
		else
			return 1;
	});
	
	var idx = this.objects.indexOf(fo);
	
	if (idx > 0) {
		return this.objects[idx - 1].row;
	} else {
		return null;
	}
};

FileObjectList.prototype.remove = function(fo) {

	var idx = this.objects.indexOf(fo);
	
	if (idx >= 0) {
		this.objects.splice(idx, 1);
	}
};

FileObjectList.prototype.contains = function(fo) {

	return (this.objects.indexOf(fo) >= 0);
};

var Directory = function (explorer, entry) {
	FileObject.call(this, explorer, entry);
	
	this.timestamp = 0;
	
	this.row = $("#directory").tmpl({
		name: ("/" + this.entry.name)
	});
	
	this.entry.getMetadata((function(metadata) {
		var date = formateDateString(metadata.modificationTime);
		$(".mdate", this.row).empty().text(date);
		$("th.last").css("width", Math.round(date.length * parseInt($("html").css("font-size")) * 0.5));
	}).bind(this), (function(){
		$(".mdate", this.row).empty().text("--");
	}).bind(this));
	
	// bind mouse events
	$(".name", this.row).parent().mousedown((function(evt){
		this.timestamp = (new Date()).getTime();
	}).bind(this));
	
	$(".name", this.row).parent().mouseup((function(evt){
		if ((new Date()).getTime() - this.timestamp > 200) {
			fileObjectActions.select(this);
		} else {
			fileObjectActions.deselect(this);
			this.change();
		}
		
		timestamp = 0;
	}).bind(this));
	
	// bind touch event
	$(".name", this.row).parent().bind("touchstart", (function(evt) {
		evt.preventDefault();
		
		this.timestamp = (new Date()).getTime();
	}).bind(this));
	
	$(".name", this.row).parent().bind("touchend", (function(evt) {
		evt.preventDefault();
		
		if ((new Date()).getTime() - this.timestamp > 200) {
			fileObjectActions.select(this);
		} else {
			fileObjectActions.deselect(this);
			this.change();
		}
		
		timestamp = 0;
	}).bind(this));
};
	
Directory.prototype = new FileObject;
Directory.prototype.constructor = Directory;
	
Directory.prototype.change = function () {
	this.explorer.change(this.entry);
};
	
var File = function (explorer, entry) {
	FileObject.call(this, explorer, entry);
		
	this.timestamp = 0;
	
	this.row = $("#file").tmpl({
		name: this.entry.name
	});
	
	// read file last modification date
	this.refreshMDate();
	
	// read file size
	this.refreshSize();
		

	// bind mouse events
	$(".name", this.row).parent().mousedown((function(evt){
		this.timestamp = (new Date()).getTime();
	}).bind(this));
	
	$(".name", this.row).parent().mouseup((function(evt){
		if ((new Date()).getTime() - this.timestamp > 200) {
			fileObjectActions.select(this);
		} else {
			fileObjectActions.deselect(this);
			this.edit();
		}
		
		timestamp = 0;
	}).bind(this));
	
	// bind touch event
	$(".name", this.row).parent().bind("touchstart", (function(evt) {
		evt.preventDefault();
		
		this.timestamp = (new Date()).getTime();
	}).bind(this));
	
	$(".name", this.row).parent().bind("touchend", (function(evt) {
		evt.preventDefault();
		
		if ((new Date()).getTime() - this.timestamp > 200) {
			fileObjectActions.select(this);
		} else {
			fileObjectActions.deselect(this);
			this.edit();
		}
		
		timestamp = 0;
	}).bind(this));
};
	
File.prototype = new FileObject;
File.prototype.constructor = File;

File.prototype.refreshSize = function() {
	this.entry.file((function(file) {
		var size = formatFileSize(file.size);
		var thWidth = Math.round(size.length * parseInt($("html").css("font-size")) * 0.7);
		
		$(".middle", this.row).empty().text(size);
		$("th.middle").css("width", (thWidth > 60 ? thWidth : 60));
	}).bind(this), (function(error) {
		$(".middle", this.row).empty().text("--");
	}).bind(this));
};

File.prototype.refreshMDate = function() {
	this.entry.getMetadata((function(metadata) {
		var date = formateDateString(metadata.modificationTime);
		$(".mdate", this.row).empty().text(date);
		$("th.last").css("width", Math.round(date.length * parseInt($("html").css("font-size")) * 0.5));
	}).bind(this), (function(){
		$(".mdate", this.row).empty().text("--");
	}).bind(this));
};
	
File.prototype.edit = function () {
	var entry = this.entry;
	var reader = new file.FileReader(entry.filesystem);
		
	var refreshFileProps = (function(){
		this.refreshSize();
		this.refreshMDate();
	}).bind(this);
	
	reader.onerror = function (evt) {
		alert("Error reading file (#" + evt.target.error.code + ")");
	};

	reader.onload = function (evt) {
		var editor = new EditDialog();
		editor.show(function (value) {
			entry.createWriter(function (writer) {
				var bb = new file.BlobBuilder();
				bb.append(value);
				
				var written = false;
		
				writer.onerror = function (evt) {
					$('.error', editor.dialog).empty().text("Error writing file (#" + evt.targer.error.code + ")");
				};
					
				writer.onwrite = function () {
					if (!written) {
						written = true;
						writer.write(bb.getBlob());
					} else {
						refreshFileProps();
						refreshExplorers();
						editor.dialog.dialog("close");
					}
				};
				
				writer.truncate(0);
			}, function (error) {
				$('.error', editor.dialog).empty().text("Error retrieving file writer (#" + error.code + ")");
			});
		}, entry.name, evt.target.result);
	};
		
	entry.file(function (file) {
		reader.readAsText(file);
	}, function (error) {
		$('.error', editor.dialog).empty().text("Error retrieving file (#" + error.code + ")");
	});
};


var Parent = function (explorer, entry) {
	FileObject.call(this, explorer, entry);
		
	this.row = $("#parent").tmpl({
		name: ".."
	});
	
	$(".name", this.row).click((this.change).bind(this));
	
	this.entry.getMetadata((function(metadata) {
		$(".mdate", this.row).empty().text(formateDateString(metadata.modificationTime));
	}).bind(this), (function(){
		$(".mdate", this.row).empty().text("--");
	}).bind(this));
};
	
Parent.prototype = new FileObject();
Parent.prototype.constructor = Parent;
	
Parent.prototype.change = function () {
	this.explorer.change(this.entry);
};

var NameDialog = function() {};

NameDialog.prototype.dialog = null;

NameDialog.prototype.show = function(ok, titleString, name) {
	$("#name_dialog .name").val(name || "");
	
	this.dialog = $('#name_dialog').dialog({
		open: function() {
			$('#name_dialog .error').empty();
		},
		buttons: {
			"[Ok]": function(event) {
				var value = $('.name', this).val().trim();
				
				if (!value) {
					$('#name_dialog .error').empty().text("Name cannot be empty!");
					return;
				}
				
				ok(value);
			},
			"[Cancel]": function() {
				$(this).dialog("close");
			}
		},
		closeOnEscape: false,
		draggable: false,
		modal: true,
		resizable: false,
		minHeight: 0,
		minWidth: 0,
		width: 250,
		title: titleString,
		position: "top",
		dialogClass: "topMargin"
	});
	
	// create file object on enter press
	$('.name', this.dialog).unbind();
	$('.name', this.dialog).bind('keyup', function(event) {
		if (String.fromCharCode(event.keyCode) == '\r') {
			var value = $(this).val().trim();
			
			if (!value) {
				$('#' + divid + ' .error').empty().text("Name cannot be empty!");
				return;
			}
			
			ok(value);
		}
	});
};

var ActionDialog = function() {};

ActionDialog.prototype.dialog = null;

ActionDialog.prototype.show = function(actionObj, titleString) {
	this.dialog = $('#action_dialog').dialog({
		buttons: actionObj,
		closeOnEscape: false,
		draggable: false,
		modal: true,
		resizable: false,
		minHeight: 0,
		minWidth: 0,
		width: 280,
		title: titleString,
		position: "top",
		dialogClass: "topMargin"
	});
};

var EditDialog = function() {};

EditDialog.prototype.dialog = null;

EditDialog.prototype.show = function(save, titleString, content) {
	$('#edit_dialog .content').empty().val(content || "");
	
	this.dialog = $('#edit_dialog').dialog({
		open: function() {
			$('#edit_dialog .error').empty();
		},
		buttons: {
			"[Save]": function(event) {
				save($('.content', this).val());
			},
			"[Discard]": function() {
				$(this).dialog("close");
			}
		},
		closeOnEscape: false,
		draggable: false,
		modal: true,
		minHeight: 0,
		minWidth: 300,
		title: ("File: " +  titleString),
		resizable: false,
		position: "top",
		dialogClass: "topMargin"
	});
};

var Explorer = function(table, newDir, newFile, refresh) {
	this.table = $(table);
	
	$(newDir).parent().show();
	
	this.dirObjects = new FileObjectList();
	this.fileObjects = new FileObjectList();
	
	$(document).bind("file.create", (this.create).bind(this));
	
	$(newDir).click((this.createDirectory).bind(this));
	$(newFile).click((this.createFile).bind(this));
	$(refresh).click((this.refresh).bind(this));
};

Explorer.prototype.directory = null;
Explorer.prototype.parent = null;

Explorer.prototype.change = function(directory) {
	this.directory = directory;
	
	this.dirObjects = new FileObjectList();
	this.fileObjects = new FileObjectList();
	
	// clear explorer content
	$('tbody', this.table).empty();
	
	// set directory name
	$('caption', this.table).empty().text(directory.fullPath);
	$('caption', this.table).css('padding', '0 8px');
	
	$('caption', this.table).css('top', -($('caption', this.table).outerHeight(true) / 2));
	$('caption', this.table).css('left', ($(this.table).outerWidth(true) / 2) - ($('caption', this.table).outerWidth(true) / 2));
	
	// add parent directory
	directory.getParent((function(parent) {
		this.parent = new Parent(this, parent);
		
		$("tbody", this.table).prepend(this.parent.row);
	}).bind(this), function(error) {
		alert("Error retrieving parent (#" + error.code + ")");
	});
	
	try {
		directory.createReader().readEntries((function(entries) {
			entries.forEach(this.addEntry, this);
		}).bind(this), (function(error) {
			if (error.code == 2) {
				this.change(this.parent.entry);
			} else {
				alert("Error reading directory (#" + error.code + ")");
			}
		}).bind(this));
	} catch(error) {
		alert("Error reading directory (#" + error.code + ")");
	}
};

Explorer.prototype.addEntry = function(entry) {
	var fileObject;
	var node;
	
	if (entry.isDirectory) {
		fileObject = new Directory(this, entry);
		node = this.dirObjects.insert(fileObject);
		
		if (node) {
			$(node, this.table).after(fileObject.row);
		} else {
			$("tr.parent", this.table).after(fileObject.row);
		}
	} else {
		fileObject = new File(this, entry);
		
		node = this.fileObjects.insert(fileObject);
		
		if (node) {
			$(node, this.table).after(fileObject.row);
		} else {
			var idx = (this.dirObjects.objects.length > 0 ? this.dirObjects.objects.length - 1 : -1);
			
			if (idx >= 0) {
				$(this.dirObjects.objects[idx].row, this.table).after(fileObject.row);
			} else{ 
				$("tr.parent", this.table).after(fileObject.row);
			}
		}
	}
};

Explorer.prototype.copyIn = function (fileObject, fileAction) {
	var name = new NameDialog();
	var entry = fileObject.entry;
	
	var refreshContent = (function(ent) {
		this.addEntry(ent);
		fileAction.cancel(fileObject);
	}).bind(this);
	
	name.show((function(value) {
		entry.copyTo(this.directory, value, function(entry) {
			refreshContent(entry);
			refreshExplorers();
			name.dialog.dialog("close");
		}, function(error) {
			if (error.code == 12) {
				$('.error', name.dialog).empty().text("Error: " + (entry.isFile ? "File" : "Folder") + " already exists!");
			} else if (error.code == 9) {
				$('.error', name.dialog).empty().text("Error: Copying " + (entry.isFile ? "file" : "folder") + " inside itself not permitted!");
			} else {
				$('.error', name.dialog).empty().text("Error copying " + (entry.isFile ? "file (#" : "folder (#") + error.code + ")");
			}
		});
	}).bind(this), (entry.isFile ? "File Copy Name:" : "Folder Copy Name:"), entry.name);
};

Explorer.prototype.moveIn = function (fileObject, fileAction) {
	var name = new NameDialog();
	var entry = fileObject.entry;
	
	var removeEntries = function() {
		fileObject.row.remove();
		
		if (entry.isFile) {
			fileObject.explorer.fileObjects.remove(fileObject);
		} else {
			fileObject.explorer.dirObjects.remove(fileObject);
		}
	};
	
	var refreshContent = (function(ent) {
		this.addEntry(ent);
		fileAction.cancel(fileObject);
	}).bind(this);
	
	name.show((function(value) {
		entry.moveTo(this.directory, value, function(entry) {
			removeEntries();
			refreshContent(entry);
			refreshExplorers();
			name.dialog.dialog("close");
		}, function(error) {
			if (error.code == 12) {
				$('.error', name.dialog).empty().text("Error: " + (entry.isFile ? "File" : "Folder") + " already exists!");
			} else {
				$('.error', name.dialog).empty().text("Error moving " + (entry.isFile ? "file (#" : "folder (#") + error.code + ")");
			}
		});
	}).bind(this), (entry.isFile ? "File Move Name:" : "Folder Move Name:"), entry.name);
};

Explorer.prototype.refresh = function () {
	this.change(this.directory);
};

Explorer.prototype.create = function (event, fileEntry) {
	if (this.directory && path.equals(this.directory.fullPath, path.dirname(fileEntry.fullPath))) {
		this.addEntry(fileEntry);
	}
};

Explorer.prototype.createDirectory = function () {
	var folder = new NameDialog();
	folder.show((function(value) {
		this.directory.getDirectory(value, {
			create: true,
			exclusive: true
		}, function(newDir) {
			$(document).trigger("file.create", newDir);
			folder.dialog.dialog("close");
		}, function(error) {
			var errMsg = "Error creating folder (#" + error.code + ")";
			
			if (error.code == FileError.PATH_EXISTS_ERR) {
				errMsg = "Error: Folder already exists!";
			}
			
			$('.error', folder.dialog).empty().text(errMsg);
		});
	}).bind(this), "New Folder Name:");
};

Explorer.prototype.createFile = function () {
	var file = new NameDialog();
	file.show((function(value) {
		this.directory.getFile(value, {
			create: true,
			exclusive: true
		}, function(newFile) {
			$(document).trigger("file.create", newFile);
			file.dialog.dialog("close");
		}, function(error) {
			var errMsg = "Error creating file (#" + error.code + ")";
			
			if (error.code == FileError.PATH_EXISTS_ERR) {
				errMsg = "Error: File already exists!";
			}
			
			$('.error', file.dialog).empty().text(errMsg);
		});
	}).bind(this), "New File Name:");
};