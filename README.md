# webgl-palette-shader

This is a single pass palette shader demo made using TypeScript, WebGL and three.js. It does phong shading on the scene and then indexes into a palette texture based using the fragment luminance for the final colours. The implementation extends the default three.js phong shader to do this.

The demo moves a directional light over a model of a city to showcase the effect. Try it out here: http://www.samcodes.co.uk/webgl/palette-shader/

### Building ###

For building I recommend the latest version of Visual Studio (2015 preview) with integrated TypeScript support. All libraries and type definitions are included in the ```jslib``` and ```tslib``` folders. The ```common``` submodule is currently used only for icons and artwork on my personal website.

### Screenshots ###

Heatmap palette:

![](screenshots/palette1.png?raw=true)

Purple palette:

![](screenshots/palette2.png?raw=true)
