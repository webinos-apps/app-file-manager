
var fsServices = {};

var fsServiceLeft, fsServiceRight;

var giga = Math.pow(1024, 3);
var mega = Math.pow(1024, 2);
var kilo = 1024;

var toSwipe = false;
var longPressDur = 1000;

$(document).ready(start);

$(document).keydown(function(evt) {
	//alert(evt.keyCode);
	
	switch (evt.which) {
		case 37: // left
			moveExpLeft();
			break;
		case 39: // right
			moveExpRight();
			break;
			
		default: return;
	}
	
});

$(window).resize(function() {
	resizeTables();
});

function start() {
	resizeTables();
	addFileActionListeners();
	
	function serviceFoundCB(service) {
		var option = $('<option>');
        option.attr('value', service.id);
        option.text(service.serviceAddress);
        fsServices[service.id] = service;
        
        $('#left_fs_service').append(option.clone());        
        $('#right_fs_service').append(option.clone());
	}
	
	function serviceLostCB(service) {
		fsServices[service.id] = NULL;
		
		var option = $('#left_fs_service option[value="' + service.id + '"]');
		option.remove();
		
		option = $('#right_fs_service option[value="' + service.id + '"]');
		option.remove();
	}
	
	function error(discoveryError) {
		alert("Discovery error: " + discoveryError.message + " (Code: #" + discoveryError.code + ")");
	}
	
	webinos.discovery.findServices(
			{api:"http://webinos.org/api/file"},
			{onFound:serviceFoundCB, onLost:serviceLostCB, onError:error}, null, null);
}

function loadFileSystem(serviceId, side) {
	var service = fsServices[serviceId];

	if (side == 'left') {
		fsServiceLeft = service;
	} else {
		fsServiceRight = service;
	}
	
	if (service) {
		service.bindService({ onBind:function(service) {
			getFileSystem(side);
		}});
	}
}

function getFileSystem(side) {
	var fsService = (side == 'left' ? fsServiceLeft : fsServiceRight);
	
	fsService.requestFileSystem(1, (1024 * 1024), function(filesystem) {
		if (typeof expLeft === "undefined" && side == 'left') {
			expLeft = new Explorer("table#left", "#left_exp_actions .newDir", "#left_exp_actions .newFile", "#left_exp_actions .refresh");
			expLeft.change(filesystem.root);
		}
		
		if (typeof expRight === "undefined" && side == 'right') {
			expRight = new Explorer("table#right", "#right_exp_actions .newDir", "#right_exp_actions .newFile", "#right_exp_actions .refresh");
			expRight.change(filesystem.root);
		}
	}, function(error) {
		alert("Error requesting filesystem (#" + error.code + ")");
	});
}

function formateDateString(modificationTime) {
	var mdate = new Date(modificationTime);
	
	var formattedDate = mdate.getFullYear().toString().substring(2) + "/";
	formattedDate += ((mdate.getMonth() + 1) < 10 ? "0" + (mdate.getMonth() + 1) : (mdate.getMonth() + 1)) + "/";
	formattedDate += (mdate.getDate() < 10 ? "0" + mdate.getDate() : mdate.getDate()) + " ";
	formattedDate += (mdate.getHours() < 10 ? "0" + mdate.getHours() : mdate.getHours()) + ":";
	formattedDate += (mdate.getMinutes() < 10 ? "0" + mdate.getMinutes() : mdate.getMinutes());
	
	return formattedDate;
}

function formatFileSize(bsize) {
	if (bsize >= giga) {
		return (getIntOrFloat(bsize / giga) + " G");
	}

	if (bsize >= mega) {
		return (getIntOrFloat(bsize / mega) + " M");
	}
	
	if (bsize >= kilo) {
		return (getIntOrFloat(bsize / kilo) + " K");
	}
	
	return (bsize + " B");
}

function getIntOrFloat(num) {
	if (num % 1 === 0) {
		return Math.round(num);
	} 
	
	return num.toFixed(1);
}

function resizeTables() {
	
	// show / hide right table
	if ($(window).width() >= 1000) {
		removeSwipeEffect();
		
		$('.tab_number .other').hide();
		$('.tab_number .current').removeClass('colored_tab_number');
	} else {
		addSwipeEffect();
		
		$('.tab_number .other').show();
		$('.tab_number .current').addClass('colored_tab_number');
	}
	
	// center table caption(s)
	$('#left caption').css('top', -($('#left caption').outerHeight(true) / 2));
	$('#left caption').css('left', ($('#left').outerWidth(true) / 2) - ($('#left caption').outerWidth(true) / 2));
	
	$('#right caption').css('top', -($('#right caption').outerHeight(true) / 2));
	$('#right caption').css('left', ($('#right').outerWidth(true) / 2) - ($('#right caption').outerWidth(true) / 2));
}

function addSwipeEffect() {
	toSwipe = true;
	
	var viewWidth = $(window).width();
	$('#content_wrapper').css('width', viewWidth);
	$('#explorer_content').css('width', (2 * viewWidth));
}

function removeSwipeEffect(savePosition) {
	toSwipe = false;
	
	$('#content_wrapper').css('width', '');
	$('#explorer_content').css('width', '');
	$('#explorer_content').css('left', 0);
}

function moveExpLeft() {
	var leftPos = $('#explorer_content').position().left;
	var conWidth = $('#explorer_content').width() / 2;
	
	if (leftPos < 0 && toSwipe) {			
		$('#explorer_content').animate({ left: ('+=' + conWidth) }, 300);
	}
}

function moveExpRight() {
	var leftPos = $('#explorer_content').position().left;
	var conWidth = $('#explorer_content').width() / 2;
	
	if (leftPos == 0 && toSwipe) {
		$('#explorer_content').animate({ left: ('-=' + conWidth) }, 300);
	}
}

function refreshExplorers() {
	if (typeof expLeft !== 'undefined') {
		expLeft.refresh();
	}
	
	if (typeof expRight !== 'undefined') {
		expRight.refresh();
	}
}

function hideFileActOptions() {
	$('#action_button_wrapper div').hide();
	$('.move', fileObjectActions.actions).css('padding-top', '8px');
	$('.copy', fileObjectActions.actions).css('padding-top', '8px');
}

function addFileActionListeners() {
	fileObjectActions = {
		actions: $("#file_actions"),
		activeExp: null,
		deselect: function(fileObject) {
			$('.first', fileObject.explorer.table).removeClass('cyan_border');
			
			if (fileObjectActions.activeExp === fileObject.explorer) {
				hideFileActOptions();
				fileObjectActions.hide();
			}
		},
		select: function(fileObject) {
			fileObjectActions.activeExp = fileObject.explorer;
			
			if (typeof expLeft !== 'undefined') {
				$('.first', expLeft.table).removeClass('cyan_border');
			}
			
			if (typeof expRight !== 'undefined') {
				$('.first', expRight.table).removeClass('cyan_border');
			}
			
			$('.first', fileObject.row).addClass('cyan_border');
			fileObjectActions.actions.data('fileobject', fileObject);
			fileObjectActions.actions.show();
		},
		hide: function() {
			fileObjectActions.actions.removeData();
			fileObjectActions.actions.hide();
		},
		copy: function(fileObject, where) {
			hideFileActOptions();
			
			if (where == 1) {
				fileObject.explorer.copyIn(fileObject, fileObjectActions);
			} else {
				if (typeof expLeft !== 'undefined' && typeof expRight !== 'undefined') {
					var copyDest = (fileObject.explorer === expLeft ? expRight : expLeft);
					
					copyDest.copyIn(fileObject, fileObjectActions);
				} else {
					alert('No copy destination!');
				}
			}
		},
		move: function(fileObject, where) {
			hideFileActOptions();
			
			if (where == 1) {
				fileObject.explorer.moveIn(fileObject, fileObjectActions);
			} else {
				if (typeof expLeft !== 'undefined' && typeof expRight !== 'undefined') {
					var moveDest = (fileObject.explorer === expLeft ? expRight : expLeft);
				
					moveDest.moveIn(fileObject, fileObjectActions);
				} else {
					alert('No move destination!');
				}
			}
		},
		deleteObject: function(fileObject) {
			var action = new ActionDialog();
			
			action.show({
				"[Ok]" : function() {
					var entry = fileObject.entry;
					
					var removeOldEntry = function() {
						if (entry.isFile) {
							fileObject.explorer.fileObjects.remove(fileObject);
						} else {
							fileObject.explorer.dirObjects.remove(fileObject);
						}
						
						fileObject.row.remove();
						action.dialog.dialog("close");
						fileObjectActions.cancel(fileObject);
					};
					
					if (entry.isFile) {
						entry.remove(function() {
							removeOldEntry();
							refreshExplorers();
						}, function(error) {
							$('.error', action.dialog).empty().text("Error deleting " + (entry.isFile ? "file " : "folder ") + "(#" + error.code + ")");
						});
					} else {
						entry.removeRecursively(function() {
							removeOldEntry();
							refreshExplorers();
						}, function(error) {
							$('.error', action.dialog).empty().text("Error deleting " + (entry.isFile ? "file " : "folder ") + "(#" + error.code + ")");
						});
					}
				},
				"[Cancel]" : function() {
					action.dialog.dialog("close");
				}
			}, (fileObject.entry.isFile ? ("Delete File: " + fileObject.entry.name + "?") : ("Delete Folder: /" + fileObject.entry.name + " ?")));
		},
		cancel: function(fileObject) {
			$('.first', fileObject.row).removeClass('cyan_border');
			
			hideFileActOptions();
			fileObjectActions.hide();
		}
	};
	
	$('#copy_here').click((function() {
		var fileObject = this.actions.data('fileobject');
		
		if (fileObject) {
			this.copy(fileObject, 1);
		}
	}).bind(fileObjectActions));
	
	$('#copy_there').click((function() {
		var fileObject = this.actions.data('fileobject');
		
		if (fileObject) {
			this.copy(fileObject, 2);
		}
	}).bind(fileObjectActions));
	
	$('.copy', fileObjectActions.actions).click((function() {
		if ($('#action_button_wrapper #copy_actions:visible').length) {
			$('#action_button_wrapper #copy_actions').hide();
			$('.copy', fileObjectActions.actions).css('padding-top', '8px');
		} else {
			$('#action_button_wrapper #move_actions').hide();
			$('.move', fileObjectActions.actions).css('padding-top', '8px');
			
			$('#action_button_wrapper #copy_actions').show();
			$('.copy', fileObjectActions.actions).css('padding-top', '11px');
		}
	}).bind(fileObjectActions));
	
	$('#move_here').click((function() {
		var fileObject = this.actions.data('fileobject');
		
		if (fileObject) {
			this.move(fileObject, 1);
		}
	}).bind(fileObjectActions));
	
	$('#move_there').click((function() {
		var fileObject = this.actions.data('fileobject');
		
		if (fileObject) {
			this.move(fileObject, 2);
		}
	}).bind(fileObjectActions));
	
	$('.move', fileObjectActions.actions).click((function() {
		if ($('#action_button_wrapper #move_actions:visible').length) {
			$('#action_button_wrapper #move_actions').hide();
			$('.move', fileObjectActions.actions).css('padding-top', '8px');
		} else {
			$('#action_button_wrapper #copy_actions').hide();
			$('.copy', fileObjectActions.actions).css('padding-top', '8px');
			
			$('#action_button_wrapper #move_actions').show();
			$('.move', fileObjectActions.actions).css('padding-top', '11px');
		}
	}).bind(fileObjectActions));
	
	$('.delete', fileObjectActions.actions).click((function() {
		hideFileActOptions();
		
		var fileObject = this.actions.data('fileobject');
		
		if (fileObject) {
			this.deleteObject(fileObject);
		}
	}).bind(fileObjectActions));
	
	$('.cancel', fileObjectActions.actions).click((function() {
		var fileObject = this.actions.data('fileobject');
		
		if (fileObject) {
			this.cancel(fileObject);
		}
	}).bind(fileObjectActions));
}
