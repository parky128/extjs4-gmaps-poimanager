
(function () {
  /*jslint browser:true */
  /*global window,google */
  /* Utility functions use "var funName=function()" syntax to allow use of the */
  /* Dean Edwards Packer compression tool (with Shrink variables, without Base62 encode). */

  /**
   * Converts "thin", "medium", and "thick" to pixel widths
   * in an MSIE environment. Not called for other browsers
   * because getComputedStyle() returns pixel widths automatically.
   * @param {string} widthValue The value of the border width parameter.
   */
  var toPixels = function (widthValue) {
    var px;
    switch (widthValue) {
    case "thin":
      px = "2px";
      break;
    case "medium":
      px = "4px";
      break;
    case "thick":
      px = "6px";
      break;
    default:
      px = widthValue;
    }
    return px;
  };
 /**
  * Get the widths of the borders of an HTML element.
  *
  * @param {Node} h  The HTML element.
  * @return {Object} The width object {top, bottom left, right}.
  */
  var getBorderWidths = function (h) {
    var computedStyle;
    var bw = {};
    if (document.defaultView && document.defaultView.getComputedStyle) {
      computedStyle = h.ownerDocument.defaultView.getComputedStyle(h, "");
      if (computedStyle) {
        // The computed styles are always in pixel units (good!)
        bw.top = parseInt(computedStyle.borderTopWidth, 10) || 0;
        bw.bottom = parseInt(computedStyle.borderBottomWidth, 10) || 0;
        bw.left = parseInt(computedStyle.borderLeftWidth, 10) || 0;
        bw.right = parseInt(computedStyle.borderRightWidth, 10) || 0;
        return bw;
      }
    } else if (document.documentElement.currentStyle) { // MSIE
      if (h.currentStyle) {
        // The current styles may not be in pixel units so try to convert (bad!)
        bw.top = parseInt(toPixels(h.currentStyle.borderTopWidth), 10) || 0;
        bw.bottom = parseInt(toPixels(h.currentStyle.borderBottomWidth), 10) || 0;
        bw.left = parseInt(toPixels(h.currentStyle.borderLeftWidth), 10) || 0;
        bw.right = parseInt(toPixels(h.currentStyle.borderRightWidth), 10) || 0;
        return bw;
      }
    }
    // Shouldn't get this far for any modern browser
    bw.top = parseInt(h.style["border-top-width"], 10) || 0;
    bw.bottom = parseInt(h.style["border-bottom-width"], 10) || 0;
    bw.left = parseInt(h.style["border-left-width"], 10) || 0;
    bw.right = parseInt(h.style["border-right-width"], 10) || 0;
    return bw;
  };

  // Page scroll values for use by getMousePosition. To prevent flickering on MSIE
  // they are calculated only when the document actually scrolls, not every time the
  // mouse moves (as they would be if they were calculated inside getMousePosition).
  var scroll = {
    x: 0,
    y: 0
  };
  var getScrollValue = function (e) {
    scroll.x = (typeof document.documentElement.scrollLeft !== "undefined" ? document.documentElement.scrollLeft : document.body.scrollLeft);
    scroll.y = (typeof document.documentElement.scrollTop !== "undefined" ? document.documentElement.scrollTop : document.body.scrollTop);
  };
  getScrollValue();

  /**
   * Get the position of the mouse relative to the document.
   * @param {Event} e  The mouse event.
   * @return {Object} The position object {left, top}.
   */
  var getMousePosition = function (e) {
    var posX = 0, posY = 0;
    e = e || window.event;
    if (typeof e.pageX !== "undefined") {
      posX = e.pageX;
      posY = e.pageY;
    } else if (typeof e.clientX !== "undefined") { // MSIE
      posX = e.clientX + scroll.x;
      posY = e.clientY + scroll.y;
    }
    return {
      left: posX,
      top: posY
    };
  };
  /**
   * Get the position of an HTML element relative to the document.
   * @param {Node} h  The HTML element.
   * @return {Object} The position object {left, top}.
   */
  var getElementPosition = function (h) {
    var posX = h.offsetLeft;
    var posY = h.offsetTop;
    var parent = h.offsetParent;
    // Add offsets for all ancestors in the hierarchy
    while (parent !== null) {
      // Adjust for scrolling elements which may affect the map position.
      //
      // See http://www.howtocreate.co.uk/tutorials/javascript/browserspecific
      //
      // "...make sure that every element [on a Web page] with an overflow
      // of anything other than visible also has a position style set to
      // something other than the default static..."
      if (parent !== document.body && parent !== document.documentElement) {
        posX -= parent.scrollLeft;
        posY -= parent.scrollTop;
      }
      // See http://groups.google.com/group/google-maps-js-api-v3/browse_thread/thread/4cb86c0c1037a5e5
      // Example: http://notebook.kulchenko.com/maps/gridmove
      var m = parent;
      // This is the "normal" way to get offset information:
      var moffx = m.offsetLeft;
      var moffy = m.offsetTop;
      // This covers those cases where a transform is used:
      if (!moffx && !moffy && window.getComputedStyle) {
        var matrix = document.defaultView.getComputedStyle(m, null).MozTransform ||
        document.defaultView.getComputedStyle(m, null).WebkitTransform;
        if (matrix) {
          if (typeof matrix === "string") {
            var parms = matrix.split(",");
            moffx += parseInt(parms[4], 10) || 0;
            moffy += parseInt(parms[5], 10) || 0;
          }
        }
      }
      posX += moffx;
      posY += moffy;
      parent = parent.offsetParent;
    }
    return {
      left: posX,
      top: posY
    };
  };
  /**
   * Set the properties of an object to those from another object.
   * @param {Object} obj The target object.
   * @param {Object} vals The source object.
   */
  var setVals = function (obj, vals) {
    if (obj && vals) {
      for (var x in vals) {
        if (vals.hasOwnProperty(x)) {
          obj[x] = vals[x];
        }
      }
    }
    return obj;
  };
  // /**
   // * Set the opacity. If op is not passed in, this function just performs an MSIE fix.
   // * @param {Node} h The HTML element.
   // * @param {number} op The opacity value (0-1).
   // */
  var setOpacity = function (h, op) {
    if (typeof op !== "undefined") {
      h.style.opacity = op;
    }
    if (typeof h.style.opacity !== "undefined" && h.style.opacity !== "") {
      h.style.filter = "alpha(opacity=" + (h.style.opacity * 100) + ")";
    }
  };
  /**
   * @name KeyDragZoomOptions
   * @class This class represents the optional parameter passed into <code>google.maps.Map.enableKeyDragZoom</code>.
   * @property {string} [key] The hot key to hold down to activate a drag zoom, <code>shift | ctrl | alt</code>.
   *  The default is <code>shift</code>. NOTE: Do not use Ctrl as the hot key with Google Maps JavaScript API V3
   *  since, unlike with V2, it causes a context menu to appear when running on the Macintosh. Also note that the
   *  <code>alt</code> hot key refers to the Option key on a Macintosh.
   * @property {Object} [boxStyle] An object literal defining the css styles of the zoom box.
   *  The default is <code>{border: "4px solid #736AFF"}</code>.
   *  Border widths must be specified in pixel units (or as thin, medium, or thick).
   * @property {Object} [veilStyle] An object literal defining the css styles of the veil pane
   *  which covers the map when a drag zoom is activated. The previous name for this property was
   *  <code>paneStyle</code> but the use of this name is now deprecated.
   *  The default is <code>{backgroundColor: "gray", opacity: 0.25, cursor: "crosshair"}</code>.
   * @property {boolean} [visualEnabled] A flag indicating whether a visual control is to be used.
   *  The default is <code>false</code>.
   * @property {string} [visualClass] The name of the CSS class defining the styles for the visual
   *  control. To prevent the visual control from being printed, set this property to the name of
   *  a class, defined inside a <code>@media print</code> rule, which sets the CSS
   *  <code>display</code> style to <code>none</code>.
   * @property {ControlPosition} [visualPosition] The position of the visual control.
   *  The default position is on the left side of the map below other controls in the top left
   *  &mdash; i.e., a position of <code>google.maps.ControlPosition.LEFT_TOP</code>.
   * @property {Size} [visualPositionOffset] The width and height values provided by this
   *  property are the offsets (in pixels) from the location at which the control would normally
   *  be drawn to the desired drawing location. The default is (35,0).
   * @property {number} [visualPositionIndex] The index of the visual control.
   *  The index is for controlling the placement of the control relative to other controls at the
   *  position given by <code>visualPosition</code>; controls with a lower index are placed first.
   *  Use a negative value to place the control <i>before</i> any default controls. No index is
   *  generally required; the default is <code>null</code>.
   * @property {String} [visualSprite] The URL of the sprite image used for showing the visual control
   *  in the on, off, and hot (i.e., when the mouse is over the control) states. The three images
   *  within the sprite must be the same size and arranged in on-hot-off order in a single row
   *  with no spaces between images.
   *  The default is <code>http://maps.gstatic.com/mapfiles/ftr/controls/dragzoom_btn.png</code>.
   * @property {Size} [visualSize] The width and height values provided by this property are
   *  the size (in pixels) of each of the images within <code>visualSprite</code>.
   *  The default is (20,20).
   * @property {Object} [visualTips] An object literal defining the help tips that appear when
   *  the mouse moves over the visual control. The <code>off</code> property is the tip to be shown
   *  when the control is off and the <code>on</code> property is the tip to be shown when the
   *  control is on.
   *  The default values are "Turn on drag zoom mode" and "Turn off drag zoom mode", respectively.
   */
  /**
   * @name DragZoom
   * @class This class represents a drag zoom object for a map. The object is activated by holding down the hot key
   * or by turning on the visual control.
   * This object is created when <code>google.maps.Map.enableKeyDragZoom</code> is called; it cannot be created directly.
   * Use <code>google.maps.Map.getDragZoomObject</code> to gain access to this object in order to attach event listeners.
   * @param {Map} map The map to which the DragZoom object is to be attached.
   * @param {KeyDragZoomOptions} [opt_addPlacemarkerOpts] The optional parameters.
   */
  function AddPlacemarker(map, opt_addPlacemarkerOpts) {
    var me = this;
    var ov = new google.maps.OverlayView();
    ov.onAdd = function () {
      me.init_(map, opt_addPlacemarkerOpts);
    };
    ov.draw = function () {
    };
    ov.onRemove = function () {
    };
    ov.setMap(map);
    this.prjov_ = ov;
  }
  /**
   * Initialize the tool.
   * @param {Map} map The map to which the DragZoom object is to be attached.
   * @param {KeyDragZoomOptions} [opt_addPlacemarkerOpts] The optional parameters.
   */
  AddPlacemarker.prototype.init_ = function (map, opt_addPlacemarkerOpts) {
    var i;
    var me = this;
    this.map_ = map;
	this.buttonDiv_ = null;

	// this.visualLine_ = new google.maps.Polyline({
		// strokeColor: '#FF0000',
		// strokeOpacity: 1.0,
		// strokeWeight: 2
	// });

    opt_addPlacemarkerOpts = opt_addPlacemarkerOpts || {};
    this.key_ = opt_addPlacemarkerOpts.key || "shift";
    this.key_ = this.key_.toLowerCase();
    this.borderWidths_ = getBorderWidths(this.map_.getDiv());
  	this.veilDiv_ = [];
    for (i = 0; i < 4; i++) {
      this.veilDiv_[i] = document.createElement("div");
      // Prevents selection of other elements on the webpage
      // when a drag zoom operation is in progress:
      this.veilDiv_[i].onselectstart = function () {
        return false;
      };
      // Apply default style values for the veil:
      setVals(this.veilDiv_[i].style, {
        backgroundColor: "gray",
        opacity: 0.15,
        cursor: "crosshair"
      });
      // Apply style values specified in veilStyle parameter:
      setVals(this.veilDiv_[i].style, opt_addPlacemarkerOpts.paneStyle); // Old option name was "paneStyle"
      setVals(this.veilDiv_[i].style, opt_addPlacemarkerOpts.veilStyle); // New name is "veilStyle"
      // Apply mandatory style values:
      setVals(this.veilDiv_[i].style, {
        position: "absolute",
        overflow: "hidden",
        display: "none"
      });
      // Workaround for Firefox Shift-Click problem:
      if (this.key_ === "shift") {
        this.veilDiv_[i].style.MozUserSelect = "none";
      }
      setOpacity(this.veilDiv_[i]);
      // An IE fix: If the background is transparent it cannot capture mousedown
      // events, so if it is, change the background to white with 0 opacity.
      if (this.veilDiv_[i].style.backgroundColor === "transparent") {
        this.veilDiv_[i].style.backgroundColor = "white";
        setOpacity(this.veilDiv_[i], 0);
      }
      this.map_.getDiv().appendChild(this.veilDiv_[i]);
    }


    //this.visualEnabled_ = opt_measureDistanceOpts.visualEnabled || false;
    this.visualClass_ = opt_addPlacemarkerOpts.visualClass || "";
    this.visualPosition_ = opt_addPlacemarkerOpts.visualPosition || google.maps.ControlPosition.TOP_LEFT;
    this.visualPositionOffset_ = opt_addPlacemarkerOpts.visualPositionOffset || new google.maps.Size(5, 5);
    this.visualPositionIndex_ = opt_addPlacemarkerOpts.visualPositionIndex || null;
    //this.visualSprite_ = opt_measureDistanceOpts.visualSprite || "http://maps.gstatic.com/mapfiles/ftr/controls/dragzoom_btn.png";
	this.visualImagePathOff_ = opt_addPlacemarkerOpts.visualImagePathOff || "http://images.pinpointers.com/PP3/addplacemarker_inactive.png";
	this.visualImagePathOn_ = opt_addPlacemarkerOpts.visualImagePathOn || "http://images.pinpointers.com/PP3/addplacemarker_active.png";
	this.visualImagePathHover_ = opt_addPlacemarkerOpts.visualImagePathHover || "http://images.pinpointers.com/PP3/addplacemarker_hover.png";
    this.visualSize_ = opt_addPlacemarkerOpts.visualSize || new google.maps.Size(26, 26);
    this.visualTips_ = opt_addPlacemarkerOpts.visualTips || {};
    this.visualTips_.off =  this.visualTips_.off || "Turn on Add POI tool";
    this.visualTips_.on =  this.visualTips_.on || "Turn off Add POI tool";


    this.boxDiv_ = document.createElement("div");
    // Apply default style values for the zoom box:
    setVals(this.boxDiv_.style, {
      border: "4px solid black"
    });
    // Apply style values specified in boxStyle parameter:
    setVals(this.boxDiv_.style, opt_addPlacemarkerOpts.boxStyle);
    // Apply mandatory style values:
    setVals(this.boxDiv_.style, {
      position: "absolute",
      display: "none"
    });
    setOpacity(this.boxDiv_);
    this.map_.getDiv().appendChild(this.boxDiv_);
    this.boxBorderWidths_ = getBorderWidths(this.boxDiv_);


	//this.listeners_ = [
      google.maps.event.addDomListener(this.veilDiv_[0], "click", function (e) {
        me.onMouseClick_(e);
      }),
      google.maps.event.addDomListener(this.veilDiv_[1], "click", function (e) {
        me.onMouseClick_(e);
      }),
      google.maps.event.addDomListener(this.veilDiv_[2], "click", function (e) {
        me.onMouseClick_(e);
      }),
      google.maps.event.addDomListener(this.veilDiv_[3], "click", function (e) {
        me.onMouseClick_(e);
      }),

	  google.maps.event.addDomListener(this.veilDiv_[0], "mousemove", function (e) {
        me.onMouseMove_(e);
      }),
      google.maps.event.addDomListener(this.veilDiv_[1], "mousemove", function (e) {
        me.onMouseMove_(e);
      }),
      google.maps.event.addDomListener(this.veilDiv_[2], "mousemove", function (e) {
        me.onMouseMove_(e);
      }),
      google.maps.event.addDomListener(this.veilDiv_[3], "mousemove", function (e) {
        me.onMouseMove_(e);
      }),
      //google.maps.event.addDomListener(window, "scroll", getScrollValue)
    //];


    this.controlActivated_ = false;
    this.mouseDown_ = false;
    this.dragging_ = false;
    this.startPt_ = null;
    this.endPt_ = null;
    this.mapWidth_ = null;
    this.mapHeight_ = null;
    this.mousePosn_ = null;
	this.mapPosn_ = null;

    //if (this.visualEnabled_) {
      this.buttonDiv_ = this.initControl_(this.visualPositionOffset_);
      if (this.visualPositionIndex_ !== null) {
        this.buttonDiv_.index = this.visualPositionIndex_;
      }
      this.map_.controls[this.visualPosition_].push(this.buttonDiv_);
      this.controlIndex_ = this.map_.controls[this.visualPosition_].length - 1;
    //}



  };
  /**
   * Initializes the visual control and returns its DOM element.
   * @param {Size} offset The offset of the control from its normal position.
   * @return {Node} The DOM element containing the visual control.
   */
  AddPlacemarker.prototype.initControl_ = function (offset) {
    var control;
    var image;
    var me = this;
    var mapDiv = me.map_.getDiv();
	var infoDiv;
    control = document.createElement("div");
    control.className = this.visualClass_;
    control.style.position = "relative";
    control.style.overflow = "hidden";
    //control.style.height = this.visualSize_.height + "px";
    //control.style.width = this.visualSize_.width + "px";
    control.title = this.visualTips_.off;
    image = document.createElement("img");
    image.src = this.visualImagePathOff_;
	//image.style.cssFloat = 'left';
	me.visualImage_ = image;

    control.appendChild(image);


    control.onclick = function (e) {

		me.controlActivated_ = !me.controlActivated_;
		if (me.controlActivated_) {
			me.visualImage_.src = me.visualImagePathOn_;
			me.buttonDiv_.title = me.visualTips_.on;
			//me.activatedByControl_ = true;
			google.maps.event.trigger(me, "activate");
		} else {
			me.visualImage_.src = me.visualImagePathOff_;
			me.buttonDiv_.title = me.visualTips_.off;
			//me.activatedByControl_ = false;
			google.maps.event.trigger(me, "deactivate");
		}
		me.mapPosn_ = getElementPosition(me.map_.getDiv());
		me.setVeilVisibility_();

    };

    control.onmouseover = function () {
      //me.buttonDiv_.firstChild.style.left = -(me.visualSize_.width * 1) + "px";
	  me.visualImage_.src = me.visualImagePathHover_;
    };
    control.onmouseout = function () {
      if (me.controlActivated_) {
        me.visualImage_.src = me.visualImagePathOn_;
        me.buttonDiv_.title = me.visualTips_.on;
      } else {
        //me.buttonDiv_.firstChild.style.left = -(me.visualSize_.width * 2) + "px";
		me.visualImage_.src = me.visualImagePathOff_;
        me.buttonDiv_.title = me.visualTips_.off;
      }
    };
    setVals(control.style, {
      cursor: "pointer",
      marginTop: offset.height + "px",
      marginLeft: offset.width + "px"
    });
    return control;
  };

AddPlacemarker.prototype.setVeilVisibility_ = function () {
    var i;
    if (this.map_) {
      var mapDiv = this.map_.getDiv();
      this.mapWidth_ = mapDiv.offsetWidth - (this.borderWidths_.left + this.borderWidths_.right);
      this.mapHeight_ = mapDiv.offsetHeight - (this.borderWidths_.top + this.borderWidths_.bottom);
      if (this.controlActivated_) { // Veil covers entire map (except control)
        var left = parseInt(this.buttonDiv_.style.left, 10) + this.visualPositionOffset_.width;
        var top = parseInt(this.buttonDiv_.style.top, 10) + this.visualPositionOffset_.height;
        var width = this.visualSize_.width;
        var height = this.visualSize_.height;
        // Left veil rectangle:
        this.veilDiv_[0].style.top = "0px";
        this.veilDiv_[0].style.left = "0px";
        this.veilDiv_[0].style.width = left + "px";
        this.veilDiv_[0].style.height = this.mapHeight_ + "px";
        // Right veil rectangle:
        this.veilDiv_[1].style.top = "0px";
        this.veilDiv_[1].style.left = (left + width) + "px";
        this.veilDiv_[1].style.width = (this.mapWidth_ - (left + width)) + "px";
        this.veilDiv_[1].style.height = this.mapHeight_ + "px";
        // Top veil rectangle:
        this.veilDiv_[2].style.top = "0px";
        this.veilDiv_[2].style.left = left + "px";
        this.veilDiv_[2].style.width = width + "px";
        this.veilDiv_[2].style.height = top + "px";
        // Bottom veil rectangle:
        this.veilDiv_[3].style.top = (top + height) + "px";
        this.veilDiv_[3].style.left = left + "px";
        this.veilDiv_[3].style.width = width + "px";
        this.veilDiv_[3].style.height = (this.mapHeight_ - (top + height)) + "px";
        for (i = 0; i < this.veilDiv_.length; i++) {
          this.veilDiv_[i].style.display = "block";
        }
      } else {
			for (i = 0; i < this.veilDiv_.length; i++) {
			this.veilDiv_[i].style.display = "none";
		  }
      }
    } else {
      for (i = 0; i < this.veilDiv_.length; i++) {
        this.veilDiv_[i].style.display = "none";
      }
    }
  };

  AddPlacemarker.prototype.onMouseMove_ = function (e) {
	//Trap mouse move event, if add placemarker tool is active, means the veil is showing over the map, so need to raise
	//event with position where mouse move occured on the map for parent application to handle
    if (this.controlActivated_) {
		var me = this;
		var pt = this.getMousePoint_(e);
		var prj = this.prjov_.getProjection();
		var latlon = prj.fromContainerPixelToLatLng(pt);

		google.maps.event.trigger(me, "mousemove", latlon);

		//this.endLL_ = e.latLng;
		//var linePoints = [this.startLL_,this.endLL_];
		//this.visualLine_.setPath(linePoints);
		//this.visualLine_.setMap(this.map_);
		//var distance = this.calculateDistance_();
		//this._measureDistanceInfoDiv.innerHTML = "Distance: " + distance.toString() + (this.visualInfoDisplayUnits_ === "M"?" miles": "km");

    }
  };

  AddPlacemarker.prototype.onMouseClick_ = function (e) {

	//Trap click event, if add placemarker tool is active, means the veil is showing over the map, so need to hide this and record the position details
	//where click occured on the map. Finish by raising click event with lat\lon details for parent application to handle
    if (this.controlActivated_) {
		var me = this;
		var pt = this.getMousePoint_(e);
		var prj = this.prjov_.getProjection();
		var latlon = prj.fromContainerPixelToLatLng(pt);

		google.maps.event.trigger(me, "mapclick", latlon);

		//this.endLL_ = e.latLng;
		//var linePoints = [this.startLL_,this.endLL_];
		//this.visualLine_.setPath(linePoints);
		//this.visualLine_.setMap(this.map_);
		//var distance = this.calculateDistance_();
		//this._measureDistanceInfoDiv.innerHTML = "Distance: " + distance.toString() + (this.visualInfoDisplayUnits_ === "M"?" miles": "km");

    }
  };

  /**
   * Get the <code>google.maps.Point</code> of the mouse position.
   * @param {Event} e The mouse event.
   * @return {Point} The mouse position.
   */
  AddPlacemarker.prototype.getMousePoint_ = function (e) {
    var mousePosn = getMousePosition(e);
    var p = new google.maps.Point();
    p.x = mousePosn.left - this.mapPosn_.left - this.borderWidths_.left;
    p.y = mousePosn.top - this.mapPosn_.top - this.borderWidths_.top;
    p.x = Math.min(p.x, this.mapWidth_);
    p.y = Math.min(p.y, this.mapHeight_);
    p.x = Math.max(p.x, 0);
    p.y = Math.max(p.y, 0);
    return p;
  };

  google.maps.Map.prototype.enableAddPlacemarker = function (opt_addPlacemarkerOpts) {
    if(this.addPlacemarker_) {
		//if(this.measureDistance_.buttonDiv_) {
			this.addPlacemarker_.buttonDiv_.style.display='block';
			this.addPlacemarker_.buttonDiv_.style.visibility='visible';
		//}
	}else {
		this.addPlacemarker_ = new AddPlacemarker(this, opt_addPlacemarkerOpts);
	}


  };
  // /**
   // * Disables drag zoom.
   // */
  AddPlacemarker.prototype.disable = function () {

	this.buttonDiv_.style.display='none';
	this.buttonDiv_.style.visibility='hidden';
  };

  google.maps.Map.prototype.getAddPlacemarkerObject = function () {
    return this.addPlacemarker_;
  };

  AddPlacemarker.prototype.deactivate = function () {

	//var me = this.addPlacemarker_;
	if(this.controlActivated_) {
		this.visualImage_.src = this.visualImagePathOff_;
		this.buttonDiv_.title = this.visualTips_.off;
		//me.controlActivated_ = false;
		this.controlActivated_ = !this.controlActivated_;
		this.setVeilVisibility_();
	}

  };

})();








