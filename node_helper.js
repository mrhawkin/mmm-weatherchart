var http = require('http');
var fs = require('fs');
var del = require('del');
var request = require('request'); 
var NodeHelper = require("node_helper");
var HashMap = require("hashmap");
var SVG  = require('svgi');


module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting node helper: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        console.error("Downloading weather map with signal: " + notification + " From URL: " + payload.domain + payload.path);
        var self = this;
        var success = false;
        if (notification === "FETCH_MAP"){
            var options = {
                host: payload.domain,
                path: payload.path
            };
            http.get(options, function (response) {
                var svgFiles = payload.mmDir + 'modules/mmm-weatherchart/cache/*.svg';
                var cachedFile = new Date().getTime() + '.svg';
                var imagePath = '/modules/mmm-weatherchart/cache/' + cachedFile;
                var imagePathAbs = payload.mmDir + imagePath.substring(1);
                var incomingData = '';
                response.on('data', function(chunk){
                    incomingData += chunk;
                });
                response.on('end', function(){
                    if(payload.customiseSVG){
                        console.log("imagePath = " + imagePath);

                        var customColours = new HashMap(payload.customColours);
                        var customSize = new HashMap(payload.customSize);

                        success = self.customiseSVG(incomingData, customColours, customSize, imagePathAbs);
                    }
                    else { // just write the image
                        success = self.writeFile(incomingData, imagePathAbs);
                    }
                    
                    if(success == true){
                        self.sendSocketNotification("MAPPED", imagePath);
                        del([svgFiles]);
                    }
                    else{
                        console.log("Customise SVG failed, sending FAILED notification ");
                        self.sendSocketNotification("FAILED", false);
                    }
                    
                    
                });
            });
        }
        
        
    },
    
    writeFile: function(data, path){
       console.log("writing file....");
       fs.writeFile(path, data, 'utf-8', function(err) {
           if(err) {
               console.log(err);
               return false;
           }

           console.log("The file was saved!");
       }); 
       return true;
    },
    
    
    readSVG: function(svgFilepath){
        var self = this;
        console.log(">> readSVG");

        console.log("svgFilepath = " + svgFilepath);
        var svgData = fs.readFileSync(svgFilepath,'utf8');

        return svgData;
        console.log("<< readSVG");
    },
    
   customiseSVG: function(meteogram, customColours, customSize, svgFilepath){
       var self = this;
       console.log(">> customiseSVG");
      
       console.log("colouring in....");
       customColours.forEach(function(value, key) {
           console.log(key + ' ==> ' + value);

           var reg = new RegExp(key,"g");   // not the safest way to do this, but #yolo
           meteogram = meteogram.replace(reg, value);
       });
       

       if(customSize.size > 0) {             // optional resize
           console.log("resizing....");
    
           customSize.forEach(function(value, key) {
                console.log(key + ' ==> ' + value);
        
                var reg = new RegExp(key);   
                meteogram = meteogram.replace(reg, value);
           });

       }


       if(!self.writeFile(meteogram, svgFilepath)){
           return false;
       }
       
       try {  // validate result (wip)
           let svgi = new SVG(meteogram);
           svgi.report();
       }
       catch (error){
           console.log(error);
           // return false;
       }

       console.log("<< customiseSVG");
       return true;
   
   },
    
    
});
