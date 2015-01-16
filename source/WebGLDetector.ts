enum WebGLSupport {
    SUPPORTED_AND_ENABLED,
    SUPPORTED_BUT_DISABLED,
    NOT_SUPPORTED,
}

class WebGLDetector {
    public static detect(): WebGLSupport {
        if (!!(<any>window).WebGLRenderingContext) {
            var canvas = document.createElement("canvas");
            var names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];

            for (var i = 0; i < 4; i++) {
                try {
                    var context = canvas.getContext(names[i]);
                    if (context && typeof context.getParameter == "function") {
                        return WebGLSupport.SUPPORTED_AND_ENABLED;
                    }
                } catch (e) { }
            }

            return WebGLSupport.SUPPORTED_BUT_DISABLED;
        }

        return WebGLSupport.NOT_SUPPORTED;
    }
}