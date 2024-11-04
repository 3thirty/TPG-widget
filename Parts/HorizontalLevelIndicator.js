/*
© Copyright 2006-2007 Apple Inc.  All rights reserved.

IMPORTANT:  This Apple software ("Apple Software") is supplied to you in consideration of your agreement to the following terms. Your use, installation and/or redistribution of this Apple Software constitutes acceptance of these terms. If you do not agree with these terms, please do not use, install, or redistribute this Apple Software.

Provided you comply with all of the following terms, Apple grants you a personal, non-exclusive license, under Apple’s copyrights in the Apple Software, to use, reproduce, and redistribute the Apple Software for the sole purpose of creating Dashboard widgets for Mac OS X. If you redistribute the Apple Software, you must retain this entire notice in all such redistributions.

You may not use the name, trademarks, service marks or logos of Apple to endorse or promote products that include the Apple Software without the prior written permission of Apple. Except as expressly stated in this notice, no other rights or licenses, express or implied, are granted by Apple herein, including but not limited to any patent rights that may be infringed by your products that incorporate the Apple Software or by other works in which the Apple Software may be incorporated.

The Apple Software is provided on an "AS IS" basis.  APPLE MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION THE IMPLIED WARRANTIES OF NON-INFRINGEMENT, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, REGARDING THE APPPLE SOFTWARE OR ITS USE AND OPERATION ALONE OR IN COMBINATION WITH YOUR PRODUCTS.

IN NO EVENT SHALL APPLE BE LIABLE FOR ANY SPECIAL, INDIRECT, INCIDENTAL OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) ARISING IN ANY WAY OUT OF THE USE, REPRODUCTION, AND/OR DISTRIBUTION OF THE APPLE SOFTWARE, HOWEVER CAUSED AND WHETHER UNDER THEORY OF CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY OR OTHERWISE, EVEN IF APPLE HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

function CreateHorizontalLevelIndicator(levelIndicatorID, spec)
{
	var levelIndicatorElement = document.getElementById(levelIndicatorID);
	if (!levelIndicatorElement.loaded) 
	{
		levelIndicatorElement.loaded = true;
		var onchanged = spec.onchange || null;
		try { onchanged = eval(onchanged); } catch (e) { onchanged = null; }
		levelIndicatorElement.object = new HorizontalLevelIndicator(levelIndicatorElement, spec.value || 0, spec.minValue || 0, spec.maxValue || 0, spec.onValue || 0, spec.warningValue || 0, spec.criticalValue || 0, spec.spacing || 0, spec.stacked || false, spec.interactive || false, spec.continuous || false, spec.imageOff || null, spec.imageOn || null, spec.imageWarning || null, spec.imageCritical || null, spec.imageWidth || 0, spec.imageHeight || 0, onchanged);
		return levelIndicatorElement.object;
	}
}

/*******************************************************************************
* HorizontalLevelIndicator
* Implementation of LevelIndicator
*
*
*/

function HorizontalLevelIndicator(levelIndicator, value, minValue, maxValue, onValue, warningValue, criticalValue, spacing, stacked, interactive, continuous, imageOff, imageOn, imageWarning, imageCritical, imageWidth, imageHeight, onchanged)
{
	/* Objects */
	this._levelIndicator = levelIndicator;
	
	/* public properties */
	// These are read-write. Set them as needed.
	this.onchanged = onchanged;
	this.continuous = continuous; // Fire onchanged live, as opposed to onmouseup
	
	// These are read-only. Use the setter functions to set them.
	this.value = value;
	
	/* Internal objects */
	this._track = null;
		
	this.imageWidth = imageWidth;
	this.imageHeight = imageHeight;
	this.imageOffPath = imageOff == null ? "Images/HorizontalOff.png" : imageOff;
	this.imageOnPath = imageOn == null ? "Images/HorizontalOn.png" : imageOn;
	this.imageWarningPath = imageWarning == null ? "Images/HorizontalWarning.png" : imageWarning;
	this.imageCriticalPath = imageCritical == null ? "Images/HorizontalCritical.png" : imageCritical;
		
	this._init(value, minValue, maxValue, onValue, warningValue, criticalValue, spacing, stacked, interactive, imageOn, imageOff, imageWarning, imageCritical, imageWidth, imageHeight);
}

// Inherit from LevelIndicator
HorizontalLevelIndicator.prototype = new LevelIndicator(null);

HorizontalLevelIndicator.prototype._getMousePosition = function(event)
{
	if (event !== undefined)
		return event.x;
	else
		return 0;
}

HorizontalLevelIndicator.prototype._computeValueFromMouseEvent = function(event)
{
	var style = this._computedLevelIndicatorStyle;
	var left = style ? parseInt(style.getPropertyValue("left"), 10) : 0;
	var width = style ? parseInt(style.getPropertyValue("width"), 10) : 0;
	var position = this._getMousePosition(event);
	var newValue = this.minValue + (((this.maxValue - this.minValue) * (position - left)) / width);
	
	if (newValue < this.minValue)
		newValue = this.minValue;
	else if (newValue > this.maxValue)
		newValue = this.maxValue;
		
	return newValue;
}

HorizontalLevelIndicator.prototype._computePositionFromValue = function(newValue)
{
	var style = this._computedLevelIndicatorStyle;
	var width = style ? parseInt(style.getPropertyValue("width"), 10) : 0;
	var position = (width * (newValue - this.minValue)) / (this.maxValue - this.minValue);
	
	return position;
}

HorizontalLevelIndicator.prototype._computeValueFromPosition = function(position)
{
	var style = this._computedLevelIndicatorStyle;
	var width = style ? parseInt(style.getPropertyValue("width"), 10) : 0;
	var newValue = this.minValue + (((this.maxValue - this.minValue) * position) / width);
		
	return newValue;
}

HorizontalLevelIndicator.prototype._computeLevelIndicatorLength = function()
{
	// get the current actual slider length
	var style = this._computedLevelIndicatorStyle;
	return style ? parseInt(style.getPropertyValue("width"), 10) : 0;
}

HorizontalLevelIndicator.prototype._layoutElements = function()
{
	var length = this._computeLevelIndicatorLength();
	var valuePosition = this._computePositionFromValue(this.value);
	var delta = 0;
	
	var imagePath = null;
	
	while (delta + this.imageWidth <= length)
	{
		var element = document.createElement("div");
		var style = element.style;
		style.position = "absolute";
		style.display = "block";
		style.top = "0px";
		style.left = delta + "px";
		style.width = this.imageWidth + "px";
		style.height = this.imageHeight + "px";
		
		if (this.stacked)
		{
			currentValue = this._computeValueFromPosition(delta + this.imageWidth);
		}

		if (delta >= valuePosition)
			imagePath = this.imageOffPath;
		else if (currentValue >= this.criticalValue && this.value >
			this.criticalValue)
			imagePath = this.imageCriticalPath;
		else if (currentValue >= this.warningValue)
			imagePath = this.imageWarningPath;
		else if (this.value >= this.onValue)
			imagePath = this.imageOnPath;
		else
			imagePath = this.imageOffPath;
        
		style.background = "url(" + imagePath + ") no-repeat top left";
		this._track.appendChild(element);
					
		delta += this.imageWidth + this.spacing;
	}
}
