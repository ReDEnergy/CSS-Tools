var request = new XMLHttpRequest();
request.open('GET', url, true);
request.onreadystatechange = function(e) {
	if(request.readyState == 4 && request.status == 200) {
		console.log("Response: ", request.responseText);
	}
	console.log("ReadyState: ", request.readyState);
	console.log("Status: ", request.status);
};

request.send(null);
