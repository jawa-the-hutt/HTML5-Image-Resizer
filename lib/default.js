
var ImageArray = [];


(function () {
    "use strict";

    window.addEventListener("load", function load(event) {
        window.removeEventListener("load", load, false);
        init();
    }, false);


    function Upload(ImageArray) {
        for (var i = 0; i < ImageArray.length; i++) {
            // Just for demonstration purposes
            console.log(ImageArray[i]);
        }
    }

    function init() {
        document.getElementById("UploadImage").addEventListener("change", function (evt) {

            // Just for demonstration purposes
            console.log(evt.target.files);

            ImageArray = resizeimage(evt, {
                CanvasImageType:    'jpeg',         // alternative is 'png'.  Default is JPEG
                ImageQuality:       0.7,            // Used in the toDataURL() function to compress JPEG's.  This will be ignored for PNG's.  Default is 1 (no compression)
                newImageRatio:      'original',     // alternative is two numbers...eg...1024/768.  Default is 'orginal'  Keeps the original image aspect ratio
                Max_PixelSize:      1024,           // The maximum longest width or height allowed depending on orientation. Default is original which gets the longest dimension and uses this
                ReturnedDataType:   'Blob'          // alternative is 'Blob'
            }, function (ImageArray) {

                //  Calling very basic 'Upload' function for demonstration purposes.
                //  You can design this function to your needs.
                var callback = Upload(ImageArray, function (callback) {
                    // other functions could be called here if needed
                });
            });
        });
    }



}());