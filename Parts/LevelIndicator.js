/*
Copyright © 2006-2007 Apple Inc.  All Rights Reserved.

IMPORTANT:  This Apple software ("Apple Software") is supplied to you in consideration of your agreement to the following terms. Your use, installation and/or redistribution of this Apple Software constitutes acceptance of these terms. If you do not agree with these terms, please do not use, install, or redistribute this Apple Software.

Provided you comply with all of the following terms, Apple grants you a personal, non-exclusive license, under Apple’s copyrights in the Apple Software, to use, reproduce, and redistribute the Apple Software for the sole purpose of creating Dashboard widgets for Mac OS X. If you redistribute the Apple Software, you must retain this entire notice in all such redistributions.

You may not use the name, trademarks, service marks or logos of Apple to endorse or promote products that include the Apple Software without the prior written permission of Apple. Except as expressly stated in this notice, no other rights or licenses, express or implied, are granted by Apple herein, including but not limited to any patent rights that may be infringed by your products that incorporate the Apple Software or by other works in which the Apple Software may be incorporated.

The Apple Software is provided on an "AS IS" basis.  APPLE MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION THE IMPLIED WARRANTIES OF NON-INFRINGEMENT, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, REGARDING THE APPPLE SOFTWARE OR ITS USE AND OPERATION ALONE OR IN COMBINATION WITH YOUR PRODUCTS.

IN NO EVENT SHALL APPLE BE LIABLE FOR ANY SPECIAL, INDIRECT, INCIDENTAL OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) ARISING IN ANY WAY OUT OF THE USE, REPRODUCTION, AND/OR DISTRIBUTION OF THE APPLE SOFTWARE, HOWEVER CAUSED AND WHETHER UNDER THEORY OF CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY OR OTHERWISE, EVEN IF APPLE HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

function LevelIndicator(levelIndicator, value, minValue, maxValue, onValue, warningValue, criticalValue, spacing, stacked, interactive, continuous, imageOff, imageOn, imageWarning, imageCritical, imageWidth, imageHeight, onchanged)
{
}

LevelIndicator.prototype._init = function(value, minValue, maxValue, onValue, warningValue, criticalValue, spacing, stacked, interactive, imageOff, imageOn, imageWarning, imageCritical, imageWidth, imageHeight)
{
	// For JavaScript event handlers
	var _self = this;
	
	this.minValue = minValue;
	this.maxValue = maxValue;
    this.onValue = onValue;
	this.warningValue = warningValue;
	this.criticalValue = criticalValue;
	this.spacing = spacing;
	this.stacked = stacked;
	this.interactive = interactive;

	this._captureEventHandler = function(event) { _self._captureEvent(event); };
	this._mousedownTrackHandler = function(event) { _self._mousedownTrack(event); };
	this._mousemoveTrackHandler = function(event) { _self._mousemoveTrack(event); };
	this._mouseupTrackHandler = function(event) { _self._mouseupTrack(event); };
	
	var style = null;
	var element = null;

	// Level Indicator Track
	element = document.createElement("div");
	style = element.style;
	style.appleDashboardRegion = "dashboard-region(control rectangle)";
	style.height = "100%";
	style.width = "100%";
	this._levelIndicator.appendChild(element);
	this._track = element;
			
	// Add event listeners
	if (this.interactive)
	{
		this._track.addEventListener("mousedown", this._mousedownTrackHandler, true);
	}
	
	this.refresh();
}


LevelIndicator.prototype.remove = function()
{
	var parent = this._track.parentNode;
	parent.removeChild(this._track);
}

/*
 * refresh() member function
 * Refresh the current level indicator position.
 * Call this to make the level indicator appear after the widget has loaded and 
 * the LevelIndicator object has been instantiated.
 */
LevelIndicator.prototype.refresh = function()
{	
	this._computedLevelIndicatorStyle = document.defaultView.getComputedStyle(this._levelIndicator, '');
	this._setValueTo(this.value);
}

LevelIndicator.prototype._setValueTo = function(newValue)
{	
	this.value = newValue;
	
	// Remove the existing children
	var track = this._track;
	while (track.hasChildNodes())
		track.removeChild(track.firstChild);
	
	this._layoutElements();

	if (this.continuous && this.onchanged != null)
		this.onchanged(this.value);
}

// Capture events that we don't handle but also don't want getting through
LevelIndicator.prototype._captureEvent = function(event)
{
	event.stopPropagation();
	event.preventDefault();
}

LevelIndicator.prototype._mousedownTrack = function(event)
{	
	// temporary event listeners
	document.addEventListener("mousemove", this._mousemoveTrackHandler, true);
	document.addEventListener("mouseup", this._mouseupTrackHandler, true);
	document.addEventListener("mouseover", this._captureEventHandler, true);
	document.addEventListener("mouseout", this._captureEventHandler, true);
		
	this._setValueTo(this._computeValueFromMouseEvent(event));
} 

LevelIndicator.prototype._mousemoveTrack = function(event)
{	
	this._setValueTo(this._computeValueFromMouseEvent(event));
} 

LevelIndicator.prototype._mouseupTrack = function(event)
{	
	document.removeEventListener("mousemove", this._mousemoveTrackHandler, true);
	document.removeEventListener("mouseup", this._mouseupTrackHandler, true);
	document.removeEventListener("mouseover", this._captureEventHandler, true);
	document.removeEventListener("mouseout", this._captureEventHandler, true);

	// Fire our onchanged event now if they have discontinuous event firing
	if (!this.continuous && this.onchanged != null)
		this.onchanged(this.value);
} 

LevelIndicator.prototype.setValue = function(newValue)
{
	this.value = newValue;
	this.refresh();
}

LevelIndicator.prototype.setMinValue = function(newValue)
{
	this.minValue = newValue;
	this.refresh();
}

LevelIndicator.prototype.setMaxValue = function(newValue)
{
	this.maxValue = newValue;
	this.refresh();
}

LevelIndicator.prototype.setOnValue = function(newValue)
{
	this.onValue = newValue;
	this.refresh();
}

LevelIndicator.prototype.setWarningValue = function(newValue)
{
	this.warningValue = newValue;
	this.refresh();
}

LevelIndicator.prototype.setCriticalValue = function(newValue)
{
	this.criticalValue = newValue;
	this.refresh();
}

LevelIndicator.prototype.setSpacing = function(newValue)
{
	this.spacing = newValue;
	this.refresh();
}

LevelIndicator.prototype.setStacked = function(newValue)
{
	this.stacked = newValue;
	this.refresh();
}

LevelIndicator.prototype.setInteractive = function(newValue)
{
	this.interactive = newValue;

	document.removeEventListener("mousedown", this._mousedownTrackHandler, true);

	if (this.interactive)
	{
		this._track.addEventListener("mousedown", this._mousedownTrackHandler, true);
		this._track.style.appleDashboardRegion = "dashboard-region(control rectangle)";
	}
	else
	{
		this._track.style.appleDashboardRegion = "none";
	}
		
	this.refresh();
}

LevelIndicator.prototype.setImageOff = function(newValue)
{
	this.imageOffPath = newValue;	
	this.refresh();
}

LevelIndicator.prototype.setImageOn = function(newValue)
{
	this.imageOnPath = newValue;	
	this.refresh();
}

LevelIndicator.prototype.setImageWarning = function(newValue)
{
	this.imageWarningPath = newValue;	
	this.refresh();
}

LevelIndicator.prototype.setImageCritical = function(newValue)
{
	this.imageCriticalPath = newValue;	
	this.refresh();
}

LevelIndicator.prototype.setImageWidth = function(newValue)
{
	this.imageWidth = newValue;	
	this.refresh();
}

LevelIndicator.prototype.setImageHeight = function(newValue)
{
	this.imageHeight = newValue;	
	this.refresh();
}
