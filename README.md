# webgl-palette-shader

WORK IN PROGRESS.

TypeScript/WebGL single pass palette shader demo using three.js. You control a directional light and view a model of a city using a range of palettes. Try it out here.

### Building ###

This is written in TypeScript, so I recommend using the latest version of Visual Studio (2015 preview) with integrated ts support. All the required libraries and type definitions are included in the ```jslib``` and ```tslib``` folders in the ```common``` submodule.

### Screenshots ###

Single-pass, phong shading with extra indexing into a texture for the palette shading: 

![](screenshots/palette1.png?raw=true)

![](screenshots/palette2.png?raw=true)

With extra bloom pass:

![](screenshots/bloom1.png?raw=true)
