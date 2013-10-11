
(function (window) {

    var ImageArray = [];

    var R = function (evt, options, callback) {
        
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
            alert('The File APIs are not fully supported in this browser.');
            return false;
        };
        

        if (typeof EXIF == "undefined") {
            alert('EXIF.js is not found');
            return false
        };

        if (typeof BinaryAjax == "undefined") {
            alert('BinaryAjax.js is not found');
            return false
        };


        // Get the options called
        var config = R.Api(options);

        // Grab the file(s) from the element
        var files = evt.target.files;

        var i = 0;

        // Start the process off and then send the Data back to the original calling function
        var Data = FilesLoop(i, function (Data) {
            callback(Data);
        });

        // For each file detected, call the LoadFile function
        // Populate the ImageArray with the resized image(s)
        function FilesLoop(i, callback) {
            if (i < files.length) {
                var DataUrl = LoadFile(files[i], config, function (DataUrl) {
                    ImageArray[i] = DataUrl;
                    FilesLoop(i + 1, callback);
                });
            } else {
                callback(ImageArray);
            };
        };

        // Call the function that will resize the image
        function LoadFile(file, config, callback) {
            var DataUrl = new R.processFile(file, config, function (DataUrl) {

                callback(DataUrl);
            });
        }
    };

    R.Api = function (options) {


        var config = {
            CanvasImageType:    'jpeg',        // alternative is 'png'
            ImageQuality:       1,             // Used in the toDataURL() function to compress JPEG's.  This will be ignored for PNG's
            newImageRatio:      'original',    // alternative is two numbers...eg...1024/768
            Max_PixelSize:      'original',    // The maximum longest width or height allowed depending on orientation.
            ReturnedDataType:   'DataUrl'      // alternative is 'Blob'
        };

        return R.Utils.extend(config, options);

    };

    window.resizeimage = R;

})(window);

(function (R) {

    R.processFile = function (f, config, callback) {

        // Only process image or audio files.
        if (!f.type.match('image.*')) {
            return false;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {

                var image = new Image();
                image.src = e.target.result;

                image.onload = function () {

                    // Determine if image has been subSampled
                    var isSubSampled = R.Utils.detectSubsampling(image);

                    // Get the EXIF orientation of the image
                    var orientation = R.Utils.GetImageOrientation(image);

                    var originalWidth = image.width;
                    var originalHeight = image.height;
                    var ImageRatio, ScaledImageRatio;

                    if (config.newImageRatio == 'original') {
                        if (originalWidth >= originalHeight) {
                            ImageRatio = originalWidth / originalHeight;
                        } else {
                            ImageRatio = originalHeight / originalWidth;
                        };
                    } else {
                        ImageRatio = config.newImageRatio;
                    };

                    if (config.Max_PixelSize == 'original') {
                        if (originalWidth >= originalHeight) {
                            config.Max_PixelSize = originalWidth;
                        } else {
                            config.Max_PixelSize = originalHeight;
                        };
                    };

                    // Calculate width and height based on desired X/Y ratio.
                    var CroppedDimensions = R.Utils.GetCroppedDimensions(ImageRatio, originalWidth, originalHeight);
                    var croppedWidth = CroppedDimensions.width;
                    var croppedHeight = CroppedDimensions.height;

                    // Determine if longest side exceeds Max_PixelSize API setting.
                    var ScaledDimensions = R.Utils.GetScaledDimensions(config.Max_PixelSize, croppedWidth, croppedHeight);
                    var ScaledWidth = ScaledDimensions.width;
                    var ScaledHeight = ScaledDimensions.height;

                    if (originalWidth >= originalHeight) {
                        ScaledImageRatio = croppedHeight / ScaledHeight;
                    } else {
                        ScaledImageRatio = croppedWidth / ScaledWidth;
                    };

                    // Cropped and Scaled Dimensions.
                    var x = -1 * (Math.round(((originalWidth - croppedWidth) / 2) / ScaledImageRatio));
                    var y = -1 * (Math.round(((originalHeight - croppedHeight) / 2) / ScaledImageRatio));
                    x = Math.min(0, x);
                    y = Math.min(0, y);
                    var NewWidth = Math.round(originalWidth / ScaledImageRatio);
                    var NewHeight = Math.round(originalHeight / ScaledImageRatio);

                    // Process the Image and do the following:
                    // 1.  Correct the Image Orientation
                    // 2.  If the image has been subSampled, correct it.
                    // 3.  Detect if the image is vertically squashed and if so, correct it.
                    var canvas = R.Utils.ProcessCanvas(image, NewWidth, NewHeight, isSubSampled, orientation, true);


                    if (config.ReturnedDataType == 'DataUrl') {
                        callback(R.Utils.convertCanvasToDataUrl(canvas, config));
                    } else if (config.ReturnedDataType == 'Blob') {
                        callback(R.Utils.convertCanvasToBlob(canvas, config));
                    } else {
                        alert('The specificed \'ReturnedDataType\' setup option can only be \'DataUrl\' or \'Blob\'.');
                        callback(false);
                    }
                }
            };
        })(f);
        reader.readAsDataURL(f);

    };

})(resizeimage);




// R.Utils
(function (R) {

    R.Utils = function () {};

    R.Utils.extend = function (destination, source) {
        for (var property in source) {
            if (source[property] && source[property].constructor &&
				source[property].constructor === Object) {
                destination[property] = destination[property] || {};
                arguments.callee(destination[property], source[property]);
            } else {
                destination[property] = source[property];
            }
        }
        return destination;
    };

    R.Utils.addClass = function (element, classname) {
        if (element.className.indexOf(classname) === -1) {
            element.className += " " + classname;
        }
    };

    // Get Image Orientation
    R.Utils.GetImageOrientation = function (image) {

        var f = 1;

        // Determine if we are looking at the file itself or the DataURL.
        if (image.src.split(',')[1]) {
            var byteString = atob(image.src.split(',')[1]);
            f = new BinaryFile(byteString, 0, byteString.length)
        } else {
            f = new BinaryFile(image.src)
        };

        var oEXIF = EXIF.readFromBinaryFile(f);

        if (oEXIF.Orientation) {
            return oEXIF.Orientation;
        } else {
            return 1;
        };

        
    }

    // get the max width and height based on the image width/height ratio.
    R.Utils.GetCroppedDimensions = function (ImageRatio, width, height) {

        var ActualImageRatio;

        if (width >= height) {
            ActualImageRatio = width / height;
        } else {
            ActualImageRatio = height / width;
        };

        if (ActualImageRatio != ImageRatio) {
            if (ActualImageRatio < ImageRatio) {
                // Crop the y-axis
                height = Math.round(width / ImageRatio);
            } else {
                // Crop with x-axis
                width = Math.round(height * ImageRatio);
            }
        }

        return { width: width, height: height };
    }
   
    // Determine max width and height of image.
    R.Utils.GetScaledDimensions = function (Max_PixelSize, width, height) {

        if (width > height) {
            if (width > Max_PixelSize) {
                height = Math.round(height * (Max_PixelSize / width));
                width = Max_PixelSize;
            }
        } else {
            if (height > Max_PixelSize) {
                width = Math.round(width * (Max_PixelSize / height));
                height = Max_PixelSize;
            }
        }

        return { width: width, height: height };
    }

    // Detecting vertical squash in loaded image.
    // Fixes a bug which squash image vertically while drawing into canvas for some images.
    R.Utils.detectVerticalSquash = function (img, iw, ih) {

        var canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = ih;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var data = ctx.getImageData(0, 0, 1, ih).data;

        // search image edge pixel position in case it is squashed vertically.
        var sy = 0;
        var ey = ih;
        var py = ih;
        while (py > sy) {
            var alpha = data[(py - 1) * 4 + 3];
            if (alpha === 0) {
                ey = py;
            } else {
                sy = py;
            }
            py = (ey + sy) >> 1;
        }
        var ratio = (py / ih);
        return (ratio === 0) ? 1 : ratio;
    };

    // Detect subsampling in loaded image.
    // In iOS, larger images than 2M pixels may be subsampled in rendering.
    R.Utils.detectSubsampling = function (img) {


        var iw = img.width, ih = img.height;
        if (iw * ih > 1024 * 1024) { // subsampling may happen over megapixel image
            var canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, -iw + 1, 0);
            // subsampled image becomes half smaller in rendering size.
            // check alpha channel value to confirm image is covering edge pixel or not.
            // if alpha value is 0 image is not covering, hence subsampled.
            return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
        } else {
            return false;
        }
    };

    // Transform canvas coordination according to specified frame size and orientation
    // Orientation value is from EXIF tag
    R.Utils.transformCoordinate = function (canvas, width, height, orientation) {


        switch (orientation) {
            case 5:
            case 6:
            case 7:
            case 8:
                canvas.width = height;
                canvas.height = width;
                break;
            default:
                canvas.width = width;
                canvas.height = height;
        }

        var ctx = canvas.getContext('2d');
        switch (orientation) {
            case 1:
                // nothing
                break;
            case 2:
                // horizontal flip
                ctx.translate(width, 0);
                ctx.scale(-1, 1);
                break;
            case 3:
                // 180 rotate left
                ctx.translate(width, height);
                ctx.rotate(Math.PI);
                break;
            case 4:
                // vertical flip
                ctx.translate(0, height);
                ctx.scale(1, -1);
                break;
            case 5:
                // vertical flip + 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.scale(1, -1);
                break;
            case 6:
                // 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.translate(0, -height);
                break;
            case 7:
                // horizontal flip + 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.translate(width, -height);
                ctx.scale(-1, 1);
                break;
            case 8:
                // 90 rotate left
                ctx.rotate(-0.5 * Math.PI);
                ctx.translate(-width, 0);
                break;
            default:
                break;
        }
    };

    R.Utils.ProcessCanvas = function (img, width, height, isSubSampled, orientation, doSquash) {

        var iw = img.naturalWidth;
        var ih = img.naturalHeight;

        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d")

        R.Utils.transformCoordinate(canvas, width, height, orientation);

        // over image size
        if (isSubSampled) {
            iw /= 2;
            ih /= 2;
        }

        var d = 1024; // size of tiling canvas

        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = tmpCanvas.height = d;
        var tmpCtx = tmpCanvas.getContext('2d');

        var vertSquashRatio = doSquash ? R.Utils.detectVerticalSquash(img, iw, ih) : 1;
        var dw = Math.ceil(d * width / iw);
        var dh = Math.ceil(d * height / ih / vertSquashRatio);
        var sy = 0;
        var dy = 0;
        while (sy < ih) {
            var sx = 0;
            var dx = 0;
            while (sx < iw) {
                tmpCtx.clearRect(0, 0, d, d);
                tmpCtx.drawImage(img, -sx, -sy);
                ctx.drawImage(tmpCanvas, 0, 0, d, d, dx, dy, dw, dh);
                ctx.save();
                sx += d;
                dx += dw;
            }
            sy += d;
            dy += dh;
        }

        tmpCanvas = tmpCtx = null;
        return canvas;
    };

    // Convert canvas to DataURL.
    R.Utils.convertCanvasToDataUrl = function (canvas, config) {

        // get the data from canvas
        if (config.CanvasImageType == 'jpeg') {
            return canvas.toDataURL("image/jpeg", config.ImageQuality);
        } else if (config.CanvasImageType == 'png') {
            return canvas.toDataURL("image/png");
        } else {
            alert('The specificed \'CanvasImageType\' setup option can only be \'jpeg\' or \'png\'.');
            return false;
        };

    }

    //Convert canvas contents to Blob object.
    R.Utils.convertCanvasToBlob = function (canvas, config) {

        var CanvasImageTypeErrorMsg = 'The specificed \'CanvasImageType\' setup option can only be \'jpeg\' or \'png\'.'

        if (canvas.mozGetAsFile) {
            // Mozilla implementation (File extends Blob).
            if (config.CanvasImageType == 'jpeg') {
                return canvas.mozGetAsFile(null, 'image/jpeg', config.ImageQuality);
            } else if (config.CanvasImageType == 'png') {
                return canvas.mozGetAsFile(null, 'image/png');
            } else {
                alert(CanvasImageTypeErrorMsg);
                return false;
            };
        } else if (canvas.toBlob) {
            // HTML5 implementation.
            if (config.CanvasImageType == 'jpeg') {
                return canvas.toBlob(null, 'image/jpeg', config.ImageQuality);
            } else if (config.CanvasImageType == 'png') {
                return canvas.toBlob(null, 'image/png');
            } else {
                alert(CanvasImageTypeErrorMsg);
                return false;
            };
        } else {
            // WebKit implementation.
            if (config.CanvasImageType == 'jpeg') {
                return createBlobFromDataUri(canvas.toDataURL('image/jpeg', config.ImageQuality));
            } else if (config.CanvasImageType == 'png') {
                return createBlobFromDataUri(canvas.toDataURL('image/png'));
            } else {
                alert(CanvasImageTypeErrorMsg);
                return false;
            };
        }
    }

    //Convert WebKit dataURI to Blob.
    R.Utils.createBlobFromDataUri = function (dataURI) {

        // Convert base64/URLEncoded data component to raw binary data held in a string
        var splitString = dataURI.split(',');
        var splitStringMime = splitString[0];
        var splitStringData = splitString[1];

        var byteString;
        if (splitStringMime.indexOf('base64') >= 0) {
            byteString = atob(splitStringData);
        } else {
            byteString = decodeURIComponent(splitStringData);
        }

        // separate out the mime component
        var mimeString = splitStringMime.split(':')[1].split(';')[0];

        // Write the bytes of the string to an ArrayBuffer
        var length = byteString.length;
        var buf = new ArrayBuffer(length);
        var view = new Uint8Array(buf);
        for (var i = 0; i < length; i++) {
            view[i] = byteString.charCodeAt(i);
        }

        // Detect if Blob object is supported.
        if (typeof Blob !== 'undefined') {
            return new Blob([buf], { type: mimeString });

        } else {
            window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
            var bb = new BlobBuilder();
            bb.append(buf);
            return bb.getBlob(mimeString);
        }
    }

})(resizeimage);


if (!Array.indexOf) {
    Array.prototype.indexOf = function (obj) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == obj) {
                return i;
            }
        }
        return -1;
    };
}



