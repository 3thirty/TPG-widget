
// search through haystack and return the text found inbetween needleStart and needleEnd
function grabSubstring (
	haystack,
	needleStart,
	needleEnd
){
	var start = haystack.indexOf(needleStart);
	var end = haystack.indexOf(needleEnd, start);
	
	if (start == -1)
		return false;
	
	return haystack.substring(start + needleStart.length, end);
}


// return the number of days in the given month (note that month is 0-based, so 0 = january, 11 = december)
function getDaysInMonth (
	month
){
	var date = new Date();
	date.setMonth(month);
	var dayCounter = 28;

	while (date.getMonth() == month) {
		dayCounter++;
		date.setDate(dayCounter);
	}

	// unwind the last iteration
	dayCounter--;

	return dayCounter;
}

// output a date from an object in human readable format
function formatDate (
	dateObject
){
	return formatMonth(dateObject.getMonth()) + " " + dateObject.getDate();
}

// get the name of the month (0-based)
function formatMonth(
	month
){
	switch (month){
		case 0:
			return "January";
		case 1:
			return "February";
		case 2:
			return "March";
		case 3:
			return "April";
		case 4:
			return "May";
		case 5:
			return "June";
		case 6:
			return "July";
		case 7:
			return "August";
		case 8:
			return "September";
		case 9:
			return "October";
		case 10:
			return "November";
		case 11:
			return "December";
	}
}

//------------
// 3thirty functions
//------------

// send diagnostic data back to 3thirty.net
function sendDiagnostic (
	data
){
	if (!_debug)
		return;

	http.open("POST", "http://www.3thirty.net/tpgwidget/sendDiagnostic.php");
	
	http.send("data=" + data + "&user=" + getSetting("username"));
}

// check if there is a new verison of this widget (via 3thirty.net)
// updates "brag tag" if a new version is available
function checkVersion (){
	if (version == "undefined")
		return false;

	http.onload = function(e) {
			newVersion = parseFloat(http.responseText);
	
			if (_debug){
				alert("checkVersion returned " + newVersion + ", current version is " + version);
			}
			
			if (newVersion > version){
				document.getElementById("bragTag").innerHTML = "New version available";
				document.getElementById("bragTag").style.color = "#40ED2E";
			}
		}

	http.open("GET", "http://www.3thirty.net/tpgwidget/checkVersion.php");
	
	http.send();
}

// go to 3thirty.net
function goTo3thirty(event) {
    widget.openURL("http://www.3thirty.net/tpgwidget");
}
