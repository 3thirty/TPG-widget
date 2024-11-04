// save the settings from the back of the widget
function saveSettings (){
	alert("saving settings. username is " + getSetting("username"));

	var modified = false;

	for (i = 0; i < settings.length; i++){
		// check if this is actually changing a value, and that there is actually a value to save
		if (getSetting(settings[i]) != document.getElementById(settings[i]).value
				&& document.getElementById(settings[i]).value != ""){
			widget.setPreferenceForKey(document.getElementById(settings[i]).value, settings[i]);
			modified = true;
		}
	}
	
	// re-grab the TPG data if the username or password has changed
	if (modified)
		getTpgData();
}

// load saved settings and display them on the back of the widget
function loadSettings (){
	for (i = 0; i < settings.length; i++){
		var saved = getSetting(settings[i]);
		
		if (saved)
			document.getElementById(settings[i]).value = saved;
	}
}

// get a setting. Return boolean false if the value is not set
function getSetting (
	setting
){
		var savedValue = widget.preferenceForKey(setting);

		if (savedValue == undefined || savedValue == "")
			return false;

		return savedValue;
}
