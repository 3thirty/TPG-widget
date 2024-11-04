/*
 * TPG Usage Widget
 * Author: Ethan Smith (ethan@3thirty.net)
 * Created: 17/05/08
 *
 * Updated: 01/06/08
 *		- Fixed bug in displaying 0MB usage
 *		- Will now abort the http connection if hidden when in the process of getting usage date
 *		- Added expiry date information
 *
 * Updated: 22/06/08
 *		- Fixed typo in displaying expiry days -- was still showing the date, instead of X days
 *		- Adjusted yellow and red sections on the indicators. The red section is now when you have used
 *		  more bandwidth than you *should* have, for the current day and length of the month. Yellow is when
 *		  you are within a day of hitting the red section. Thanks to Steven for the idea and algorithm.
 *
 * Updated: 27/07/08 (rev: 4)
 *		- Fixed bug in calculating "target usage" - not everyone has a billing
 *		  cycle that coincides with the end of the month!
 *		- Now displays < 1 day as "today" (I saw 0, and maybe a negative on my
 *		  installation last month)
 *		- Added option to click on the expiry date (or days) and change mode. Note that once
 *		  this option is set, the widget will not override it (unless the mac is restarted or
 *		  the widget is reinstalled)
 *
 * Updated: 30/07/08 (rev: 5)
 *		- Added sendDiagnostic() function. Currently only called when undexpected data is received
 *		  from AJAX call
 * 
 * Updated: 31/07/08
 *		- Don't save empty values for settings
 *		- If you're over your total limit for the month, default to 75% warning and 90% critical for color
 *		  coding. Otherwise, the entire bar is green
 *
 * Updated: 02/08/08 (rev: 6)
 *		- Fixed bug in calculating offpeak usage (typo). Previously, offpeak was always green
 *		- Removed unnecessary saveSettings call
 *		- Converted all ints to floats, so we keep fractions of gb/mb
 *		- Fixed display bug: the short horizontal usage bars don't have the granularity to show really small
 *		  percentages (eg at the start of the billing period). So, we overwrite them with some friendlier
 *		  values (10% of total for warning, 15% for critical). It's less accurate, but clearer than showing
 *		  a single red light
 *
 * Updated: 03/08/08 (rev: 7)
 *		- Added option to click the usage value and see the target value
 *
 * Updated: 03/08/08 (rev: 8)
 *		- New version notification added
 *
 * Updated: 06/08/08 (rev: 9)
 *		- Fixed major bug in percentage calculations that was causing us to *always* use the 10% warning, 20%
 *		  critical limits
 *		- Modified horizontalIndicator behaviour - don't show critical unless we are *over* the critical
 *		  limit. Basically, this has the effect of "rounding down" from critical to warning, which is useful,
 *		  given the granularity of the indicator I'm using
 *		- Removed target percentage, it's unnecessary
 *		- Fixed minor bug with clicking on the two targets in quick succession
 *
 * Updated: 20/08/09 (rev: 11, version 1.11)
 *		- Updated to handle minor wording change on TPG website ("download" to "downloads")
 * 
 */
 
// global debug variable
var _debug = false;

// set the version
var version = 1.11;

// global array of DOM element IDs to load/save
var settings = new Array ("username", "password", "mode", "peakMax", "offpeakMax");

// the http object
var http = new XMLHttpRequest();

// setup today's date
var now = setupDate();
var expiry;
var expiryMode;

var lastTimeout;

//
// Function: load()
// Called by HTML body element's onload event when the widget is ready to start
//
function load()
{
	// dunno. something dashcode wants to do
    setupParts();
	
	document.getElementById("password").setAttribute("type", "password");
	document.getElementById("text").style.cursor = "normal";
	
	// set up the front for the option that the user has selected
	setupIndicators();
}

// hide/show the indicators and labels depending on the user's selection
function setupIndicators(){
	if (getSetting("mode") == "both"){
		document.getElementById("secondaryUsageIndicator").style.display = "";
		document.getElementById("secondaryUsageIndicatorLabel").style.display = "";
		document.getElementById("usageIndicatorLabel").innerHTML = "Peak:";
		document.getElementById("secondaryUsageIndicatorValueLabel").style.display = "";
	} else {
		document.getElementById("secondaryUsageIndicator").style.display = "none";
		document.getElementById("secondaryUsageIndicatorLabel").style.display = "none";
		document.getElementById("secondaryUsageIndicatorValueLabel").style.display = "none";
		if (getSetting("mode") == "peak")
			document.getElementById("usageIndicatorLabel").innerHTML = "Peak:";
		if (getSetting("mode") == "offpeak")
			document.getElementById("usageIndicatorLabel").innerHTML = "Off Peak:";
		if (getSetting("mode") == "combined")
			document.getElementById("usageIndicatorLabel").innerHTML = "Usage:";			
	}
	
	document.getElementById("usageIndicatorValueLabel").style.cursor = "pointer";
	document.getElementById("secondaryUsageIndicatorValueLabel").style.cursor = "pointer";
}

// set the global "now" date object to the *current* date
function setupDate (){
	now = new Date();
	now.setHours(0);
	now.setMinutes(0);
	now.setSeconds(0);
	
	return now;
}

// setup the objects for doing date calculations on the expiry date
function setupExpiryDate (
	expiryDate // the string from the TPG page
){
	if (expiryDate == "")
		return false;

	// conver the date string to a JS date object
	expiry = new Date(expiryDate);

	return expiry;
}

//
// Function: remove()
// Called when the widget has been removed from the Dashboard
//
function remove()
{
    // Stop any timers to prevent CPU usage
    // Remove any preferences as needed
    // widget.setPreferenceForKey(null, createInstancePreferenceKey("your-key"));
}

//
// Function: hide()
// Called when the widget has been hidden
//
function hide()
{
    // Stop any timers to prevent CPU usage
	http.abort();
}

//
// Function: show()
// Called when the widget has been shown
//
function show()
{	
	// make sure our global date is still current
	setupDate();
	
	// connect to TPG and get the usage details
	getTpgData();
}


//
// Function: sync()
// Called when the widget has been synchronized with .Mac
//
function sync()
{
    // Retrieve any preference values that you need to be synchronized here
    // Use this for an instance key's value:
    // instancePreferenceValue = widget.preferenceForKey(null, createInstancePreferenceKey("your-key"));
    //
    // Or this for global key's value:
    // globalPreferenceValue = widget.preferenceForKey(null, "your-key");
}

//
// Function: showBack(event)
// Called when the info button is clicked to show the back of the widget
//
// event: onClick event from the info button
//
function showBack(event)
{
	// populate the saved settings
	loadSettings();

    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToBack");
    }

    front.style.display = "none";
    back.style.display = "block";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
	
	document.getElementById("bragTag").style.cursor = "pointer";
	
	checkVersion();
}

//
// Function: showFront(event)
// Called when the done button is clicked from the back of the widget
//
// event: onClick event from the done button
//
function showFront(event)
{
	saveSettings();
	setupIndicators();
	positionTarget();

    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToFront");
    }

    front.style.display="block";
    back.style.display="none";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
}

if (window.widget) {
    widget.onremove = remove;
    widget.onhide = hide;
    widget.onshow = show;
    widget.onsync = sync;
}

// make an HTTP request to TPG to get the current usage
function getTpgData (){
	if (!getSetting("username") || !getSetting("password")){
		document.getElementById("text").innerHTML = "No username or password entered";
		return;
	}
		
	document.getElementById("text").innerHTML = "Getting data from TPG...";
	
	var tpgUrl = "https://cyberstore.tpg.com.au/your_account/index.php?function=checkaccountusage"

	http.onload = function(e) {readResponse(http);}
	http.open("POST", tpgUrl);
	
	http.send("check_username=" + getSetting("username") + "&password=" + getSetting("password"));
}

// read the response from the HTTP Request object
function readResponse (
	http
){
	if (http.readyState == 4)
		parseResponse(http.responseText);
}

// parse the output and get the values that we are interested in
// we want to read back the peak and offpeak usage, so we look for something like:
//		Peak Download used: 7738.842 MB
//		Off-Peak Download used: 809.940 MB
function parseResponse (
	text
){
	var peakUsage = grabSubstring(text, "Peak Downloads used: ", " MB");
	var offpeakUsage = grabSubstring(text, "Off-Peak Downloads used: ", " MB");

	// get the expiry date from TPG. This includes HTML tags so will be pretty temperamental
	var expiryDate = grabSubstring(text, "Expiry Date:</b>", "</td>");
	expiry = setupExpiryDate(expiryDate);

	if (peakUsage === false){
		var errorText = "Error reading TPG data. "
			+ "Are your login details correct?";
		document.getElementById("text").innerHTML = errorText;
		sendDiagnostic(errorText + "\n\nResponse was: " + text);
		return;
	}

	var indicatorValue = 0;
	var indicatorMaxValue = 0;
	var indicatorCriticalValue = 0;
	var indicatorWarningValue = 0;
	var secondaryIndicatorValue = 0;
	var secondaryIndicatorMaxValue = 0;
	var secondaryIndicatorCriticalValue = 0;
	var secondaryIndicatorWarningValue = 0;
	switch (getSetting("mode")){
		case "peak":
			indicatorValue = peakUsage;
			indicatorMaxValue = getSetting("peakMax") * 1000
			indicatorCriticalValue = getUsageTarget("peak");
			indicatorWarningValue = getUsageTarget("peak", true);
			break;
		case "offpeak":
			indicatorValue = offpeakUsage;
			indicatorMaxValue = getSetting("offpeakMax") * 1000;
			indicatorCriticalValue = getUsageTarget("offpeak");
			indicatorWarningValue = getUsageTarget("offpeak", true);
			break;
		case "both":
			indicatorValue = peakUsage;
			indicatorMaxValue = getSetting("peakMax") * 1000;
			indicatorCriticalValue = getUsageTarget("peak");
			indicatorWarningValue = getUsageTarget("peak", true);
		
			secondaryIndicatorValue = offpeakUsage;
			secondaryIndicatorMaxValue = getSetting("offpeakMax") * 1000;
			secondaryIndicatorCriticalValue = getUsageTarget("offpeak");
			secondaryIndicatorWarningValue = getUsageTarget("offpeak", true);
			break;
		case "combined":
			indicatorMaxValue = (getSetting("peakMax") + getSetting("offpeakMax")) * 1000;
			indicatorValue = parseFloat(peakUsage) + parseFloat(offpeakUsage);
			indicatorCriticalValue = getUsageTarget("peak") + getUsageTarget("offpeak");
			indicatorWarningValue = getUsageTarget("peak", true) + getUsageTarget("offpeak", true);
			break;
	}
	
	// if you're over the limit, use the hard coded values for warning and critical values
	// otherwise, the whole bar is green!
	if (parseFloat(peakUsage) > (getSetting("peakMax") * 1000)){
		indicatorCriticalValue = 0.9;
		indicatorWarningValue = 0.75;
	}
	
	updateIndicator("usageIndicator", indicatorValue, indicatorMaxValue, indicatorCriticalValue, indicatorWarningValue);
	if (getSetting("mode") == "both"){
		if (parseFloat(offpeakUsage) > (getSetting("offpeakMax") * 1000)){
			secondaryIndicatorCriticalValue = 0.9;
			secondaryIndicatorWarningValue = 0.75;
		}
		
		updateIndicator("secondaryUsageIndicator", secondaryIndicatorValue, secondaryIndicatorMaxValue, secondaryIndicatorCriticalValue, secondaryIndicatorWarningValue);
	}
		
	// all is good, show the expiry date
	showExpiryString(expiryMode);
}

// update the given indicator with the value and maxValue settings
function updateIndicator (
	name,
	value,
	maxValue,
	criticalPercent,
	warningPercent
){
	var value = parseFloat(value);

	if (_debug){
		alert("parameters passed to updateIndicator:")
		alert("\tname: " + name);
		alert("\tvalue: " + value);
		alert("\tmaxValue: " + maxValue);
		alert("\tcriticalPercent: " + criticalPercent);
		alert("\twarningPercent: " + warningPercent);
	}

	// the short horizontal usage bars don't have the granularity to show really small
	// percentages (eg at the start of the billing period). So, we overwrite them with
	// some friendlier values
	if (criticalPercent < 0.1)
		criticalPercent = 0.2;
	if (warningPercent < 0.1)
		warningPercent = 0.1;

	var indicator = document.getElementById(name);
	indicator.object.setMaxValue(maxValue);
	indicator.object.setCriticalValue(maxValue * criticalPercent); // set the critical value to today's target
	indicator.object.setWarningValue(maxValue * warningPercent); // set the warning value to today's target, minus the usage each day, so you will be warned if you're one day off going over
	indicator.object.setValue(value);
	document.getElementById(name + "ValueLabel").innerHTML = formatUsage(value);

	if (_debug){
		alert("indicator: " + name);
		alert("\tvalue is " + indicator.object.value);
		alert("\tmaxValue is " + indicator.object.maxValue);
		alert("\tcritical value is " + indicator.object.criticalValue);
		alert("\twarning value is " + indicator.object.warningValue);
	}
}
	
// calculate where the usage *should* be for today,
// given the day of the month and the total bandwidth allowance
// this is returned as a decimal of the crurrent usage
function getUsageTarget (
	mode,
	getWarning
){
	// because this is called each time an indicator is shown, we can't use getSetting("mode")
	// for the "both" option
	if (typeof(mode) == "undefined")
		var mode = getSetting("mode");
	
	// Note: algorithm is days * (maxUsage / days in the month)
	if (mode == "peak")
		var usageMax = getSetting("peakMax");
	else if (mode == "offpeak")
		var usageMax = getSetting("offpeakMax");
	else
		var usageMax = 0;

	var targetValue = parseFloat(getDaysInMonth(now.getMonth()) - getExpiryDays()) * getPerDayTarget(usageMax);
	
	// if we want the warning value, this is critical value - 1 day's uage
	// TODO: I'm not sure if this is going to give us enough of a "warning" zone... it might
	// just jump from green to red
	if (getWarning){
		return ((targetValue - getPerDayTarget(usageMax)) / usageMax);
	} else
		return (targetValue / usageMax);
}

// get the amount of bandwidth that can be used each day to hit the monthly target
function getPerDayTarget (
	usageMax
){
	return usageMax / getDaysInMonth(now.getMonth());
}

// position the target indicator to where the usage *should* be for today
// NOTE: not used at the moment.. it looks crappy
function positionTarget(){
    // Note: 240px is the 100% mark
		
	// get the GB value as a percentage. multiply this by 240 (the 100% pixel position)
	// to give us the offset from the left, default position
	var pos = 240 * getUsageTarget();
	
	var target = document.getElementById("target");
	target.style.position = "relative";
	target.style.left = pos + "px";
}

// take the usage figure (in MB) from TPG, in the format 12345.678 and convert it to
// a human-readable format - 12.3GB, or 1MB
function formatUsage (
	mb
){
	mb = parseFloat(mb);
	
	if (mb > 1000){
		var ret = (mb / 1000)
		return ret.toFixed(1) + "GB" // 1 decimal place for GB
	} else {
		return mb.toFixed(0) + "MB" // no decimals for MB.. it gets too long
	}
}

// change the way we want the epxiry date to be displayed - either days or date
function switchExpiryMode (){
	if (typeof(expiry) != "object")
		return;

	if (expiryMode == "date")
		expiryMode = "days";
	else if (expiryMode == "days")
		expiryMode = "date";
	else
		return;

	document.getElementById("text").innerHTML = getExpiryString(expiryMode);
}

// take an expiry date and output a string describing when the usage will be reset
// If this is more than 7 days away, we show the date, otherwise we show " in X days"
function getExpiryString (
	forceFormat // whether to display the string in the saved "expiryMode"
){
	if (typeof(expiry) != "object")
		return;
		
	var expiryDays = getExpiryDays();
	if (forceFormat != "")
		expiryMode = forceFormat;

	// if we have a specific date format, use that 
	if (forceFormat == "date"){
		expiryString = "Usage to be reset on " + formatDate(expiry);
	} else if (forceFormat == "days") {
		if (expiryDays < 1)
			expiryString = "Usage reset today";
		else
			expiryString = "Usage reset in " + expiryDays + " days";
	// otherwise, use the default: < 7 days = # of days, < 1 = today, otherwise use the date
	} else if (expiryDays <= 7 && expiryDays > 1){
		expiryMode = "days";
		expiryString = "Usage reset in " + expiryDays + " days";
	} else if (expiryDays < 1){
		expiryMode = "days";
		expiryString = "Usage reset today";
	} else {
		expiryMode = "date";
		expiryString = "Usage to be reset on " + formatDate(expiry);
	}
	
	return expiryString;
}

function showExpiryString(
	expiryMode
){
	textBox = document.getElementById("text");

    textBox.innerHTML = getExpiryString(expiryMode);
	document.getElementById("text").onClick = "switchExpiryMode()";
	
	var fadeHandler = function(a, c, s, f){ textBox.style.opacity = c; };
	new AppleAnimator(500, 13, 0.0, 1.0, fadeHandler).start();
}

// get the number of days left in the current billing cycle, rouding up
function getExpiryDays (){
	if (typeof(expiry) != "object")
		return 0;

	return Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
}

// show the target usage for the label that was clicked
function showTarget(
	event
){
	if (getSetting("mode") == "both"){
		if (event.currentTarget.id == "usageIndicatorValueLabel")
			var mode = "peak";
		else
			var mode = "offpeak";
	} else if (getSetting("mode") == "combined"){
		var mode = "Total";
		var targetUsage = (getUsageTarget("peak") * getSetting("peakMax")) + (getUsageTarget("offpeak") * getSetting("offpeakMax"));
	} else {
		var mode = getSetting("mode");
	}

	if (!targetUsage){
		var targetUsage = getUsageTarget(mode) * getSetting(mode + "Max");
	}
	
	showTargetString(mode, targetUsage);
}

// update the text area with the usage target information
function showTargetString (
	mode,
	targetUsage
){
	textBox = document.getElementById("text");

    textBox.innerHTML = mode.charAt(0).toUpperCase() + mode.substr(1) + " target: " + parseFloat(targetUsage).toFixed(2) + "GB";

	var fadeHandler = function(a, c, s, f){ textBox.style.opacity = c; };
	new AppleAnimator(500, 13, 0.0, 1.0, fadeHandler).start();
	
	// cancel the last setTimeout so we don't jump from bandwidth -> date -> bandwidth
	if (lastTimeout > 0)
		clearTimeout(lastTimeout);
	
	// go back to the expiry date after 10 seconds
	lastTimeout = setTimeout("showExpiryString()", 10000);
}
