HTML5-Image-Resizer
===================

Resize Images to be uploaded to a server

This Javascript library is created in an effort to afford an easy way to resize images on the fly before they are uploaded to a server.

It uses the HTML5 Files API process each image and resize it to the options configured at the time the 'resizeimage' function is called.


The options that can be configured are:

CanvasImageType:    'jpeg'         // alternative is 'png'.  Default is JPEG
ImageQuality:       0.7            // Used in the toDataURL() function to compress JPEG's.  This will be ignored for PNG's.  Default is 1 (no compression)
newImageRatio:      'original'     // alternative is two numbers...eg...1024/768.  Default is 'orginal'  Keeps the original image aspect ratio
Max_PixelSize:      1024           // The maximum longest width or height allowed depending on orientation. Default is original which gets the longest dimension and uses this
ReturnedDataType:   'Blob'         // alternative is 'Blob'


You must use the BinaryAjax.ls  and EXIF.js libraries.  They can be found here: http://www.nihilogic.dk/labs/exif/

