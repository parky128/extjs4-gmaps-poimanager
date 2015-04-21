# extjs4-gmaps-poimanager
POI creation tool using a custom Google maps control.

Based on similar code used in the [Drag Zoom](http://google-maps-utility-library-v3.googlecode.com/svn/trunk/keydragzoom/examples/dragzoom.html) tool works from Google Maps [Utility Library](https://code.google.com/p/google-maps-utility-library-v3/wiki/Libraries), I created an add POI tool library which is activated through a custom map control.

[Working Demo](http://parky128.github.io/extjs4-gmaps-poimanager/)

###Instructions
To add a new POI, click on the control (looks like a pushpin button) in the top left of the map above the standard zoom\pan controls. This will dim the map panel, and turn the cursor into a crosshair when mousing over the map area.

Click on a location where you wish to create a new POI, and an ExtJS window containing form will display, allowing you to enter in some details.

After successfully creating the POI, it will get added to a local ExtJS store which is bound to a grid component displayed to the left hand side of the map.

[To Do List](https://github.com/parky128/extjs4-gmaps-poimanager/issues)
