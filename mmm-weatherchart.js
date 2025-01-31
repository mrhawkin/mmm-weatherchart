Module.register("mmm-weatherchart", {

    defaults: {
        updateInterval: 60 * 60 * 1000, // every hour
        hideBorder: false,
        retryDelay: 2500,
        domain: "www.yr.no",
        mmDirectory: "/home/pi/MagicMirror/", // not sure whether it is possible to ask MM for this path?
        customiseSVG: true, // change colours in hex values or "default" for no change
        background_colour: "black", // background
        text_colour: "#d9d9d9", // text
        label_text_colour: "#f2f2f2", // label text color
        above_zero_line_colour: "#c60000", // templine color above 0
        below_zero_line_colour: "#006edb", // templine color below 0
        minor_gridline_colour: "#43443c", // gridline
        major_gridline_colour: "#9d9f93", // midnight line
        wind_line_colour: "#aa00f2", // windline
        rain_colour: "#0062bf", // raindrop
        snow_colour: "#ffffff", // snow
        moon_colour_a: "#afb3b6", // moonstart
        moon_colour_b: "#acafb3", // moonstop
	yr_logo_circle: "#004a61", 
        hide_branding: false,               // hide the yr, nrk & mi logos


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
			wrapper.style.height = "306px";
			if (width == 782) {
				width -= 14;
			} else { // If hoursToShow is set, we've already cut off the right-side border
				width -= 7;
			}
		} else {
			img.style.left = "0px";
			wrapper.style.height = "391px";
		}
		wrapper.style.width = width + "px";
	}
	img.src = this.srcMap;
	wrapper.appendChild(img);
	return wrapper;
    },

    start: function() {
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
            useSVG: this.config.useSVG,
            customiseSVG: this.config.customiseSVG,
            customColours: this.customColours,
            customSize: this.customSize
        };
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
            ["Weather forecast for ", ''],
            ['currentColor', this.config.default_fill_colour],  // wind arrows, etc
            ['fill="white', 'fill="'+this.config.background_colour],
            ['fill="#ffffff', 'fill="'+this.config.background_colour],
            ['fill: #ffffff', 'fill: '+this.config.background_colour],
            ['background-color:#ffffff', 'background-color:'+this.config.background_colour],
            ["#21292b", this.config.default_text_colour],
            ["#56616c", this.config.label_text_colour],
            ["#c3d0d8", this.config.minor_gridline_colour],
            ["#56616c", this.config.major_gridline_colour],
            ["#c60000", this.config.above_zero_line_colour],
            ['stop-color="#006edb', 'stop-color="' + this.config.below_zero_line_colour],
            ["#47c0e3", this.config.snow_colour],  
            ["#006EDB", this.config.rain_colour],                       // rain drop
            ['fill="#006edb', 'fill="' + this.config.rain_colour],      // rain level
            ['height="20%" fill="' + this.config.rain_colour, 'height="20%" fill="' + this.config.below_zero_line_colour],  // revert the temperature key
            ['#00b9f1', this.config.yr_logo_circle ], 
            ['#686e73', this.config.moon_colour_a],
            ['#6a7075', this.config.moon_colour_b],
            ['1.3-1>', '1.3-1.7,2.2-2.1,2.4l0,0l0,0L6,12c0.8-0.5,2.9-1.4,2.9-4.4L9,0.4L9,0.4z" /></g></svg>'] // bugfix? for dodgy, unclosed yr logo xml
        ];

        if(this.config.hide_branding) {
            var branding = [
                ['width="30"', 'width="0"'],                    // hide yr logo
                ['height="30"', 'height="0"'],
                ['Served by', ''],
                ['width="39.5"', 'width="0"'],                  // hide nrk logo
                ['height="13.941176470588236"', 'height="0"'],
                ['width="82.5"', 'width="0"'],       //hide Met. Institutt logo
                ['height="22.247191011235955"', 'height="0"']

            ];

            array = array.concat(branding);
        }
        
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
