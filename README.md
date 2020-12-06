# Magic Mirror Module: mmm-weatherchart
This [MagicMirror2](https://github.com/MichMich/MagicMirror) module allows you to show a weather diagram provided by http://www.yr.no

![Screenshot](Screenshot.png "Screenshot")


## About

This builds on the module made by paphko, big thanks to him for creating it :)
The main difference is this fork uses the svg image from yr.no, which allows us to customise the look. Additionally, the image is much sharper because the browser can render everything nicely.

You can override the default styling, have a look at the defaults in `mmm-weatherchart.js` for the available values, and set your custom values in your magic mirror config.
We can also override the scaling, so you can have a giant forecast if you wish.


Because i am a newbie when it comes to node.js and manipulating svg, i just maintain these changes in a fork for now.
Hopefully someone with better knowledge would be willing to review or rewrite this properly and merge to his repo.

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/paphko/mmm-weatherchart.git
````

Configure the module in your `config.js` file.

## Using the module

To use this module, you must first determine country, area, and city:

1. go to http://www.yr.no
2. enter your location into the search field at the top and select your city
3. at the top-right, switch language to English
4. write down country, area, and city from the current URL, e.g.: http://www.yr.no/place/Germany/North_Rhine-Westphalia/Duisburg/

Now add the module to the modules array in the `config/config.js` file:
````javascript
modules: [
    {
        module: 'mmm-weatherchart',
        position: 'bottom_left', // this can be any of the regions
        config: {
            country: 'Germany', // as determined above
            area: 'North_Rhine-Westphalia', // as determined above
            city: 'Duisburg', // as determined above
            updateInterval: 60 * 60 * 1000, // update every hour
            hideBorder: true, // whether or not a border with city name should be shown
            negativeImage: true, // whether or not the default white image should be inverted
            // mmDirectory: "/home/pi/MagicMirror/" // required for caching; adjust if it differs
        }
    },
]
````

## Configuration options

The following properties can be configured:


<table width="100%">
    <!-- why, markdown... -->
    <thead>
        <tr>
            <th>Option</th>
            <th width="100%">Description</th>
        </tr>
    <thead>
    <tbody>
        <tr>
            <td><code>country</code></td>
            <td>Your country as determined above</td>
        </tr>
        <tr>
            <td><code>area</code></td>
            <td>Your area as determined above</td>
        </tr>
        <tr>
            <td><code>city</code></td>
            <td>Your city name as determined above</td>
        </tr>
        <tr>
            <td><code>updateInterval</code></td>
            <td>Update interval of the diagram.
                <br><b>Default value:</b> <code>60 * 60 * 1000</code> (once every hour)
            </td>
        </tr>
        <tr>
            <td><code>hideBorder</code></td>
            <td>Wheather or not a border with city name should be shown.
                <br><b>Default value:</b> <code>true</code>
            </td>
        </tr>
        <tr>
            <td><code>negativeImage</code></td>
            <td>Wheather or not the white image should be inverted.
                <br><b>Default value:</b> <code>true</code>
            </td>
        </tr>
        <tr>
            <td><code>mmDirectory</code></td>
            <td>To avoid the image to be cached by the browser (issue #5), it is downloaded into the magic mirror / modules / mmm-weatherchart / cache folder.
                I couldn't find a way to ask MM for this path, so I just hard-coded it here with the possibility to adjust it in case your installation looks different.
                <br><b>Default value:</b> <code>/home/pi/MagicMirror/</code>
            </td>
        </tr>
    </tbody>
</table>



Here are the extra values which can be configured.
```
        useSVG: true,
        customiseSVG: true,    // change colours in hex values or "default" for no change
        background_colour:    "#000000",
        title_text_colour : "#d9d9d9",    // "Meteogram for...."
        date_text_colour : "#f2f2f2",     // "Tuesday"
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
        // these values should make the forecast full width on a full HD, 1080p screen in landscape orientation
        customize_size: false,           // whether to override the size of the forecast image. by default, just use the size from yr.no
        override_scale_factor: 2,        // forecast will be twice as big. 
        override_width: 1920,            // image canvas needs to be expanded to draw a bigger forecast.
        override_height: 550,            // as above
        override_x_location: 100,        // shift image horizontally
        override_y_location: 0           // shift image vertically
```