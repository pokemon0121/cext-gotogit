var user = null;
var repo = null;
var lang = null;
var token = null;
var problemName = null;
var code = '';


chrome.tabs.query({active : true, currentWindow: true}, function(array_of_tabs){
	var tab = array_of_tabs[0];
	var words = tab.url.split('/');
	$('.url').text(tab.url);
	if (words.length < 4 || words[3] != 'problems') {
		$('.problom-name').text("Not on a problem's page!");
		$('#message').text("Not on a problem's page!");
		$('#notification').text("Not on a problem's page!");
	}
	else {
		$('.problom-name').text(words[4]);
		problemName = words[4];
		// then start
		start();
	} 
});



chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
  	code = '';
  	var preview = '';
    var codeArea = $($.parseHTML(request.source)).find('pre.CodeMirror-line');
    for (var i = 0; i < codeArea.length; i++) {
    	code = code + codeArea.eq(i).text() + "\n";
    	preview = preview + codeArea.eq(i).text() + "<br>";
    };
    $('#message').html("code ready:<br>" + preview);
    $('#go').prop("disabled", false); // only here to enable button
  }
});

$('#go').click(function() {
	if (problemName != null) {
	    shipIt(problemName);
	    $('#go').prop("disabled", true);
	}
	else {
		$('#notification').text('cannot find problem name.')
	}
})

$(window).load(function() {
  	chrome.tabs.executeScript(null, {
    	file: "getPagesSource.js"
  	}, function() {
    	// If you try and inject into an extensions page or the webstore/NTP you'll get an error
    	if (chrome.runtime.lastError) {
      		$('#message').text('There was an error injecting script : \n' + chrome.runtime.lastError.message);
    	}
  	});
});

function createFile(pName) {
	$.ajax({ 
	    url: 'https://api.github.com/repos/' + user + '/' + repo + '/contents/' + pName + '.' + lang,
	    method: 'PUT',
	    contentType: "application/json",
	    dataType: 'json',
	    cache: false,
	    data: '{"message": "auto-create-file commit", "content": "' + getData() + '"}',
	    beforeSend: function(xhr) { 
	        xhr.setRequestHeader("Authorization", "token " + token); 
	    },
	    success: (function(response) {
		    //console.log(response);
		    $('.github-info').text("File created!");
		}),
		error: (function(xhr) {
			$('.github-info').text("status: " + xhr.status + ", responseText: " + xhr.responseText);
		})
	});
}

function shipIt(pName) {
	$.ajax({ 
	    url: 'https://api.github.com/repos/' + user + '/' + repo + '/contents/' + pName + '.' + lang,
	    method: 'GET',
	    contentType: "application/json",
	    cache: false,
	    beforeSend: function(xhr) { 
	        xhr.setRequestHeader("Authorization", "token " + token); 
	    },
	    success: (function(response) {
		    //it exists
		    $('.github-info').text("File exists, updating it.");
		    updateFile(pName, response.sha);
		}),
		error: (function(xhr) {
			if (xhr.status == 404) {
				// it does not exist
				$('.github-info').text("No such file, so creating one.");
				createFile(pName);
			}
			else {
				$('.github-info').text("status: " + xhr.status + ", responseText: " + xhr.responseText);
			}
		})
	});
}

function updateFile(pName, sha) {
	$.ajax({ 
	    url: 'https://api.github.com/repos/' + user + '/' + repo + '/contents/' + pName + '.' + lang,
	    method: 'PUT',
	    contentType: "application/json",
	    dataType: 'json',
	    cache: false,
	    data: '{"message": "auto-update-file commit", "content": "' + getData() + '", "sha": "' + sha + '"}',
	    beforeSend: function(xhr) { 
	        xhr.setRequestHeader("Authorization", "token " + token); 
	    },
	    success: (function(response) {
		    //console.log(response);
		    $('.github-info').text("File updated!");
		}),
		error: (function(xhr) {
			$('.github-info').text("status: " + xhr.status + ", responseText: " + xhr.responseText);
		})
	});
}

function getData() {
	//var data = "Updated/Created at " + new Date($.now()) + ".";
	//console.log(data)
	return btoa(unescape(encodeURIComponent(code)));
}

function start() {
	// load config
	$.ajax({
		url: chrome.runtime.getURL('/config.json'),
		method: 'GET',
		dataType: 'json',
		cache: 'false',
		success: (function(response) {			
			user = response.user;
			token = response.token;
			repo = response.repo;
			lang = response.lang;
		}),
		error: (function(xhr) {
			$('#notification').text('loading config file failed.  ' + "status: " + xhr.status + ", responseText: " + xhr.responseText);
			$('#go').prop("disabled", true);
		})
	});
}