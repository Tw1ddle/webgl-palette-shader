# webgl-palette-shader

This is a single pass palette shader demo made using TypeScript, WebGL and three.js. A directional light hovering over a model of a city and lights it up with various colour palettes. Try it out here: http://www.samcodes.co.uk/webgl/palette-shader/

### Building ###

This is written in TypeScript, so I recommend using the latest version of Visual Studio (2015 preview) with integrated ts support. All the required libraries and type definitions are included in the ```jslib``` and ```tslib``` folders in the ```common``` submodule.

### Screenshots ###

Single-pass, phong shading with extra indexing into a texture for the palette shading: 

![](screenshots/palette1.png?raw=true)

![](screenshots/palette2.png?raw=true)

With extra bloom pass:

![](screenshots/bloom1.png?raw=true)
