# webgl-palette-shader

This is a single pass palette shader demo made using TypeScript, WebGL and three.js. Single-pass phong shading plus indexing into a texture based on fragment luminance for palette shading. A directional light hovering over a model of a city and lights it up with various colour palettes. Try it out here: http://www.samcodes.co.uk/webgl/palette-shader/

### Building ###

For building I recommend the latest version of Visual Studio (2015 preview) with integrated TypeScript support. All libraries and type definitions are included in the ```jslib``` and ```tslib``` folders. The ```common``` submodule is currently used only for icons and artwork on my personal website.

### Screenshots ###

Default heatmap palette:

![](screenshots/palette1.png?raw=true)

Purple palette:

![](screenshots/palette2.png?raw=true)
