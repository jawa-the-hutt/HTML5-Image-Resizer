### HTML5-Image-Resizer
===================

Resize Images to be uploaded to a server

This Javascript library is created in an effort to afford an easy way to resize images on the fly before they are uploaded to a server.

It uses the HTML5 Files API to process each image and resize it to the options configured at the time the 'resizeimage' function is called.

This library also incorporates fixes to address issues with images in IOS 6.x and above as seen here:  https://github.com/stomita/ios-imagefile-megapixel

The options that can be configured are:

1. **CanvasImageType** -- This can be 'jpeg' or 'png'
2. **ImageQuality** -- Decimal scale from 0 to 1.  Used in the toDataURL() function to compress JPEG's.  This will be ignored for PNG's.  Default is 1 (no compression).
3. **newImageRatio** -- What you want the new image(s) aspect ratio to be.  'Original' is the default. The alternative is to use two numbers...eg...1024/768.  
4. **Max_PixelSize** -- The maximum pixel length allowed depending on orientation. Default is 'original' which gets the longest dimension and uses this.  Otherwise enter in a number
5. **ReturnedDataType**   -- 'Blob' or 'DataURL'



You must use the BinaryAjax.ls  and EXIF.js libraries for this to function.  They can be found here: http://www.nihilogic.dk/labs/exif/

