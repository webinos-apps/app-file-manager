var root;
var pwd;
var askContext = {};

function print(x) {
	//document.getElementById("log").innerHTML += x + "<br/>";
}

function parentDir() {
	try {
		print(typeof pwd);
		print(pwd.name);
		print(pwd.parent);
		if (pwd.parent !== null) {
			pwd = pwd.parent;
			display();
		}
	}
	catch(e) {

	}
}

function openFile(x) {
	try {
		pwd.listFiles(
		function(files){
			if (files && files.length > x) {
				var f = files[x];
				pwd = f;
			}
			display();
		}, listFilesErrorCB);
	}
	catch(e) {

	}
}

function askCallback() {
	var text = document.fsctrl.askText.value;
	document.fsctrl.innerHTML = '';
	askContext.callback(text);
}

function ask(msg, callback) {
	askContext.callback = callback;
	document.fsctrl.innerHTML =
		msg
		+ '<input id="askText" name="askText" type="text"/>'
		+ '<input type="submit" onclick="askCallback()" value="OK"/>';
	document.fsctrl.askText.focus();
}

function newDir() {
	ask("Directory name: ", function(text) {
		try {
			var d = pwd.createDirectory(text);
			display();
		}
		catch(e) {
		}
	});
}

function newFile() {
	ask("File name: ", function(text) {
		try {
			var f = pwd.createFile(text);
			pwd = f;
			display();
		}
		catch(e) {
		}
	});
}

function saveFile() {
	if (!pwd.isDirectory) {
		try {
			pwd.openStream(
			function(stream) {
				stream.write(document.getElementById("text").value);
				stream.close();
				display();
			}, 
			function(e) {
				print("Failed to open. " + e.message);
				display();
			}, "w", "UTF-8");
		}
		catch(e) {
			print(e.message);
		}
	}
}

function display() {

	var currname = pwd.fullPath;
	var str = "<div id='path'>" + currname + "</div>";

	if (pwd.isDirectory) {
		str += "<div id='menu'><a href='javascript:newDir();'>[New dir]</a>  <a href='javascript:newFile()'>[New file]</a>  <a href='javascript:display()'>[Refresh]</a></div>";
		str += "<table>";
		if (pwd.parent !== null) {
			str += "<tr><td><a href='javascript:parentDir();'>[ .. ]</a></td><td>&lt;dir&gt;</td></tr>";
		}
		var i;
		try {
			pwd.listFiles(
			function(files){
				print("Length " + files.length);
				for (i = 0; i < files.length; i++) {
					var f = files[i];
					var sz;
					if(f.isDirectory) {
						sz = "&lt;dir&gt;";
					}
					else {
						sz = f.fileSize;
					}
					str += "<tr><td><a href='javascript:openFile(" + i + ");'>" + f.name + "</a></td><td>" + sz + "</td></tr>";
				}
				str += "</table>";
				printContent(str);
			},listFilesErrorCB);
		}
		catch(e) {
			print(e.message);
		}
	}
	else {
		print(pwd.name + " is the edited file.");
		str += "<div id='menu'><a href='javascript:parentDir();'>[Close editor]</a>  <a href='javascript:saveFile()'>[Save]</a>  <a href='javascript:display()'>[Reload]</a></div>";
		str += "<div id='editor'>";
		// consider base64 on some file attributes?
		var txt = "";
		try {
			var stream = pwd.openStream(
			function(stream) {
				txt = stream.read(pwd.fileSize);
				var r = stream.close();
				str += "<textarea id='text' cols='80' rows='21'>" + txt + "</textarea></div>";
				printContent(str);
			},
			function(e) {
				print("Failed to open. " + e.message);
			}, "r", "UTF-8");
		}
		catch(ex) {}
	}
}

function reset() {
	var location = "documents";
	print(location);
	deviceapis.filesystem.resolve(function(x) {
		pwd = x;
		display();
	},
	function(e) {
		print("Failed to resolve. " + e.message);
	},
	location, "rw");

}

function listFilesErrorCB(e) {
	print("Failed to listFiles. " + e.message);
}

function printContent(str) {
	document.getElementById("fscontent").innerHTML = str;
}