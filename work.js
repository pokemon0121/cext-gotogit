var user = 'pokemon0121';
var repo = 'LC';
var lang = 'java';



var problemName = null;
var codeReady = false;
var code = '';

chrome.tabs.query({active : true, lastFocusedWindow: true}, function(array_of_tabs){
	var tab = array_of_tabs[0];
	var words = tab.url.split('/');
	$('.url').text(tab.url);
	if (words.length < 4 || words[3] != 'problems')
		$('.problom-name').text("Not on a problem's page!");
	else {
		$('.problom-name').text(words[4]);
		problemName = words[4];
		$('#go').prop("disabled", false);
	} 
});

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
  	codeReady = false;
  	code = '';
  	var preview = '';
    var codeArea = $($.parseHTML(request.source)).find('pre.CodeMirror-line');
    for (var i = 0; i < codeArea.length; i++) {
    	code = code + codeArea.eq(i).text() + "\n";
    	preview = preview + codeArea.eq(i).text() + "<br>";
    };
    $('#message').html("code ready:<br>" + preview);
    codeReady = true;
  }
});

$('#go').click(function() {
  if (codeReady) {
    shipIt(problemName);
    $('#go').prop("disabled", true);
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
	        xhr.setRequestHeader("Authorization", "token 0287808a57427be5e7892e2946a8f2d527100801"); 
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
	        xhr.setRequestHeader("Authorization", "token 0287808a57427be5e7892e2946a8f2d527100801"); 
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
				$('.github-info').text("Unexpected");
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
	        xhr.setRequestHeader("Authorization", "token 0287808a57427be5e7892e2946a8f2d527100801"); 
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