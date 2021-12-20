Module.register("mmm-weatherchart", {

    defaults: {
        locationPath: "/en/content/2-3196359/meteogram.svg",
        updateInterval: 60 * 60 * 1000, // update every hour
        hideBorder: true, 
        retryDelay: 2500,
        domain: "www.yr.no",
        mmDirectory: "/home/pi/MagicMirror/", // not sure whether it is possible to ask MM for this path?
	hoursToShow: -1, // Cut the image down to show less than the full 48 hour forecast. -1 to show everything.
        customiseSVG: true,    // change colours in hex values or "default" for no change
        background_colour: "#000000",
        title_text_colour: "#d9d9d9",    // "Meteogram for...."
        date_text_colour: "#f2f2f2",     // "Tuesday"
        temperature_text_colour: "#f2f2f2", // vertical axis
        rain_text_colour: "#f2f2f2",        // amount of rain 
        below_zero_line_colour: "#74c4fe", 
        above_zero_line_colour: "#ffdb48",    
        minor_gridline_colour: "#43443c",
        major_gridline_colour: "#9d9f93",
        wind_direction_colour: "#9d9f93",
        rain_colour: "#83d2fe",
        snow_colour: "#ffffff",   
        moon_colour_a: "#afb3b6", 
        moon_colour_b: "#acafb3",


        // properties to override the image size. 
        // to use them, set customize_size: true
        // these values should make the forecast full width on a full HD, 1080p screen  
        customize_size: false,          // whether to override the size of the forecast image. 
        override_scale_factor: 2,          // forecast will be twice as big. requires customize_size: true 
        override_width: 1920,            // image canvas needs to be expanded to draw a bigger forecast.
        override_height: 550,            // as above
        override_x_location: 100,        // shift image horizontally
        override_y_location: 0            // shift image vertically
    },

    // Define required scripts.
    getScripts: function() {
        return ["moment.js", "hashmap.js"];
    },

	getDom: function() {
		var wrapper = document.createElement("div");
		var img = document.createElement("img");
		if (this.config.hideBorder || this.config.hoursToShow > 0) {
			var width = 782;
			wrapper.style.overflow = "hidden";
			wrapper.style.position = "relative";
			img.style.position = "absolute";

			if (this.config.hoursToShow > 0 && this.config.hoursToShow < 48) {
				width = 34 + 12.5 * this.config.hoursToShow;
			}

			if (this.config.hideBorder) {
				img.style.top = "-85px";
				img.style.left = "0px";
				wrapper.style.height = "360px";
				if (width == 782) {
					width -= 14;
				} else { // If hoursToShow is set, we've already cut off the right-side border
					width -= 7;
				}
			} else {
				img.style.left = "0px";
				wrapper.style.height = "380px";
			}
			wrapper.style.width = width + "px";
		}
		if (this.config.negativeImage) {
			img.style["-webkit-filter"] = "invert(100%) grayscale(100%)";
		}
		img.src = this.srcMap;
		wrapper.appendChild(img);
		return wrapper;
	},

    start: function() {
        Log.info("Starting module: " + this.name);
        this.loaded = false;
        this.scheduleUpdate(3); // wait some 3 secs and run initial update
        this.updateTimer = null;
        this.customColours = this.createCustomColourArray();
        this.customSize = this.createCustomSizeArray();
    },

    
    getWeatherMap: function() {
        var self = this;
        var payload = {
            domain: this.config.domain,
            path: this.config.locationPath,
            mmDir: this.config.mmDirectory,
            customiseSVG: this.config.customiseSVG,
            customColours: this.customColours,
            customSize: this.customSize
        };
        Log.info("Downloading weather map from URL: " + payload.domain + payload.path);
        console.log("Downloading weather map from URL: " + payload.domain + payload.path);

        self.sendSocketNotification("FETCH_MAP", payload);
    },

    socketNotificationReceived: function(notification, payload) {
        var self = this;
        if (notification === "MAPPED"){
            this.srcMap = payload;
            if (typeof this.srcMap !== "undefined") {
                this.loaded = true;
                this.updateDom();
            }
            this.scheduleUpdate();
        }
        else if (notification === "FAILED"){
            this.scheduleUpdate(retryDelay);
        }
            
    },
    
    
    
    // return 2d array (map) of new colours to be set in the meteogram
    // key = colour; value = replacement colour from config
    createCustomColourArray: function() {
        var array = [
            ["Meteogram for ", ''],
            ["fill="currentColor"", 'fill="' + this.config.wind_direction_colour + '"'],
            ['rect x="0" y="0" width="100" height="100" fill="white"', 'rect x="0" y="0" width="100" height="100" fill="' + this.config.background_colour + '"'],  // inner background
            ["fill: #21292b;", "fill: " + this.config.title_text_colour + ";"],
            ["#000080", this.config.title_text_colour],
            ["#212D2C", this.config.temperature_text_colour],
            ["#EAEBE6", this.config.minor_gridline_colour],
            ["#CFD0CA", this.config.major_gridline_colour],
            ["#8B918F", this.config.wind_direction_colour],
            ["#505956", this.config.date_text_colour],
            ["#F01C1C", this.config.above_zero_line_colour],
            ["#0280D9", this.config.below_zero_line_colour],
            ["#47c0e3", this.config.snow_colour],  
            ["#0062bf", this.config.rain_colour],  // rain drop
            ["#37BFE1", this.config.rain_colour],  // rain level
            ['g id="logo-yr"', 'g id="logo-yr" fill="#231F20" '], // make yr logo visible
            ['#686e73', this.config.moon_colour_a],
            ['#6a7075', this.config.moon_colour_b],
            ['1.3-1>', '1.3-1.7,2.2-2.1,2.4l0,0l0,0L6,12c0.8-0.5,2.9-1.4,2.9-4.4L9,0.4L9,0.4z" /></g></svg>'] // bugfix? for dodgy, unclosed yr logo xml
        ];
        
        return array;
    },
    
    // return 2d array (map) of new dimensions to be set in the meteogram
    // key = raw value from yr; value = replacement colour from config
    createCustomSizeArray: function() {

        if(!this.config.customize_size) {
            var array = [];
            return array;
        }


        var array = [
            ['width="828" height="272"', 'width="' + this.config.override_width + '"  height="' + this.config.override_height + '"'],
            ['transform="translate\\(0\\.5,0\\.5\\)"', 'transform="translate(' + this.config.override_x_location + ',' + this.config.override_y_location + ') scale(' + this.config.override_scale_factor + ')"' ]
        ];
        
        return array;
    },


    scheduleUpdate: function(delay) {
        var nextLoad = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }
        var self = this;
        clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(function() {
            self.getWeatherMap();
        }, nextLoad);
    },
});

