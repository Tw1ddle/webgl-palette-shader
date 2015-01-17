module THREE {
    export var BloomPass;
}

class Main {
    private main_loop_clock: THREE.Clock;
    private renderer: THREE.Renderer;
    private renderstats: Stats = new Stats();
    private updatestats: Stats = new Stats();
    private dat: dat.GUI;
    private dat_palette_folder: dat.GUI;
    private renderer_size: THREE.Vector2;

    private created: boolean = false;
    private will_animate: boolean = false;

    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private camera_target: THREE.Vector3;

    private raycaster: THREE.Raycaster;
    private input_ray: THREE.Vector3;
    private input_dir: THREE.Vector3;
    private pointer_position: THREE.Vector2;

    private model: THREE.Mesh;
    private rotation: THREE.Vector3 = new THREE.Vector3();
    private palette: THREE.Texture;

    private rotation_enabled: boolean = true;
    private rotation_speed: number = 2;

    private show_light: boolean = true;
    private light_helper: THREE.DirectionalLightHelper;
    private light_texture: THREE.Texture;
    private light_sprite: THREE.Sprite;
    private light: THREE.DirectionalLight;

    private enable_bloom: boolean = false;
    private effect_composer: THREE.EffectComposer; // Used for bloom effect
    private render_target: THREE.WebGLRenderTarget;

    private light_tween: TWEEN.Tween;
    private light_tweening_enabled: boolean = true;
    private light_x: number = 200;
    private light_y: number = 200;
    private light_z: number = -300;
    private intensity: number = 1.1;

    private palette_index_change_controller: dat.GUIController;
    private palette_name_change_controller: dat.GUIController;
    private num_palettes: number = 10;
    private _palettes_loaded: number = 0;
    private current_palette: number = 0;
    private palette_name: string = "heatmap";

    private palettes: Array<string> = ["heatmap", "sunrise_at_sea", "skyline", "purple", "peachy", "city_stone", "translucent_yellow", "translucent_alien", "red_sunset", "solid_gold", "gray"];

    constructor () {
        this.create();

        if (this.will_animate) {

            this.setup_stats();
            this.setup_options();

            this.animate();
        }
    }

    private setup_stats(): void {
        this.renderstats.setMode(1);
        this.renderstats.domElement.style.position = 'absolute';
        this.renderstats.domElement.style.left = '0px';
        this.renderstats.domElement.style.top = '40px';
        document.body.appendChild(this.renderstats.domElement);

        this.updatestats.setMode(1);
        this.updatestats.domElement.style.position = 'absolute';
        this.updatestats.domElement.style.left = '0px';
        this.updatestats.domElement.style.top = '100px';
        document.body.appendChild(this.updatestats.domElement);
    }

    private setup_options(): void {
        this.dat = new dat.GUI();
        this.dat.add(this, "enable_bloom", false);
        var camera = this.dat.addFolder("camera");
        camera.add(this, "rotation_enabled", true);
        camera.add(this, "rotation_speed", 2, 15);
        var lighting = this.dat.addFolder("lighting");
        lighting.add(this, "light_tweening_enabled", true).onChange(this.on_light_tween_enabled_change);
        lighting.add(this, "show_light", true).onChange(this.on_show_light_change);
        lighting.add(this, "intensity", 0.1, 5).onChange(this.on_light_intensity_change);
        lighting.add(this, "light_x", -200, 300).listen();
        lighting.add(this, "light_y",  200, 400).listen();
        lighting.add(this, "light_z", -300, 300).listen();
        this.dat_palette_folder = this.dat.addFolder("palette");

        lighting.open();
        this.dat_palette_folder.open();
    }

    private create(): void {
        if (!this.created) {
            this.main_loop_clock = new THREE.Clock(true);

            this.renderer_size = new THREE.Vector2(window.innerWidth, window.innerHeight - this.get_footer_height());

            var webgl_support = WebGLDetector.detect();

            if (webgl_support === WebGLSupport.SUPPORTED_AND_ENABLED) {
                this.scene = new THREE.Scene();
                this.camera_target = new THREE.Vector3(0, 150, 0);
                this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
                this.camera.position.y = 800;

                this.create_webgl_scene();

                this.populate_scene();
                this.setup_shader();

                this.light_texture = THREE.ImageUtils.loadTexture("assets/images/disc.png", THREE.Texture.DEFAULT_MAPPING, this.on_light_texture_loaded, this.on_texture_loaded_error);

                this.palette = THREE.ImageUtils.loadTexture("assets/images/" + this.palettes[0] + ".png", THREE.Texture.DEFAULT_MAPPING, this.on_texture_loaded, this.on_texture_loaded_error);
                for (var i = 1; i <= this.num_palettes; i++) {
                    THREE.ImageUtils.loadTexture("assets/images/" + this.palettes[i].toString() + ".png", THREE.Texture.DEFAULT_MAPPING, this.on_additional_palette_loaded, this.on_texture_loaded_error);
                }

                var container = document.createElement('div');
                document.body.appendChild(container);
                var info = document.createElement('div');
                info.style.position = 'absolute';
                info.style.top = '20px';
                info.style.width = '100%';
                info.style.textAlign = 'center';
                info.style.color = 'white';
                info.innerHTML = '<a href="https://github.com/Tw1ddle/webgl-palette-shader/" target="_blank">palette shader</a> by <a href="http://www.samcodes.co.uk/" target="_blank">samcodes</a>. model by <a href="http://www.cs.columbia.edu/~keenan/Projects/ModelRepository/" target="_blank">keenan crane</a>.';
                container.appendChild(info);

                this.will_animate = true;
            } else {
                this.create_canvas_scene();
                this.will_animate = false;
            }

            this.created = true;
        }
    }

    private create_webgl_scene(): void {
        var gl_renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true });
        gl_renderer.setSize(this.renderer_size.x, this.renderer_size.y + 1);
        gl_renderer.autoClear = true;
        gl_renderer.gammaInput = true;
        gl_renderer.gammaOutput = true;
        gl_renderer.setClearColor(new THREE.Color(0, 0, 0));
        this.renderer = gl_renderer;

        var left: number = 0;
        var right: number = this.renderer_size.x;
        var top: number = this.renderer_size.y;
        var bottom: number = 0;

        this.render_target = new THREE.WebGLRenderTarget(right - left, top - bottom, {
            minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: true
        });
        this.effect_composer = new THREE.EffectComposer(gl_renderer, this.render_target);

        var renderPass = new THREE.RenderPass(this.scene, this.camera);
        var bloomEffect = new THREE.BloomPass(1.2, 25, 4, 512);
        bloomEffect.renderTargetX.format = THREE.RGBAFormat;
        bloomEffect.renderTargetY.format = THREE.RGBAFormat;
        var copyPass = new THREE.ShaderPass(THREE.CopyShader);
        copyPass.renderToScreen = true;

        this.effect_composer.addPass(renderPass);
        this.effect_composer.addPass(bloomEffect);
        this.effect_composer.addPass(copyPass);

        this.raycaster = new THREE.Raycaster();
        this.input_ray = new THREE.Vector3();
        this.input_dir = new THREE.Vector3();

        this.pointer_position = new THREE.Vector2(9999, 9999);

        var div = document.getElementById("background");
        div.appendChild(this.renderer.domElement);

        window.addEventListener('resize', this.on_window_resize, false);

        document.addEventListener('contextmenu', this.on_context_menu, false);
        this.renderer.domElement.addEventListener('mousedown', this.on_mouse_down, false);
        this.renderer.domElement.addEventListener('mousemove', this.on_mouse_move, false);
        this.renderer.domElement.addEventListener('mouseup', this.on_mouse_up, false);
    }

    private create_canvas_scene(): void {
        var div = document.getElementById("background");

        var container = document.createElement('div');
        document.body.appendChild(container);
        var info = document.createElement('div');
        info.style.position = 'absolute';
        info.style.top = '20px';
        info.style.width = '100%';
        info.style.textAlign = 'center';
        info.style.color = 'white';

        info.innerHTML = '<a href="https://github.com/Tw1ddle/webgl-palette-shader/" target="_blank">Sorry, this page requires WebGL. Click here to view screenshots and code instead</a>.';
        container.appendChild(info);

        div.appendChild(container);
    }

    private setup_shader(): void {
        THREE.ShaderLib['phong'].uniforms = THREE.UniformsUtils.merge([
            THREE.UniformsLib["common"],
            THREE.UniformsLib["fog"],
            THREE.UniformsLib["lights"],
            THREE.UniformsLib["shadowmap"],

            {
                "ambient": { type: "c", value: new THREE.Color(0xffffff) },
                "emissive": { type: "c", value: new THREE.Color(0x000000) },
                "wrapRGB": { type: "v3", value: new THREE.Vector3(1, 1, 1) },

                "luminanceMin": { type: "f", value: 0.0 },
                //"luminanceMax": { type: "f", value: 1.0 },
                "luminanceRange": { type: "f", value: 1.0 },
                "currentPaletteSlots": { type: "f", value: 4.0 },
                "palette": { type: "t", value: null },
            },
        ]);

        var uniforms: string =
            [
                "uniform float luminanceMin;",
                "uniform float luminanceMax;",
                "uniform float luminanceRange;",
                "uniform float currentPaletteSlots;",
                "uniform sampler2D palette;",
                "",
            ].join("\n");

        var toon: string =
            [
                "",
                "float luminance = 0.2126 * gl_FragColor.r + 0.7152 * gl_FragColor.g + 0.0722 * gl_FragColor.b;",
                "float slotIndex = ((luminance - luminanceMin) / luminanceRange);",
                "vec4 baseColor = gl_FragColor;",
            //"gl_FragColor = mix(baseColor, texture2D(palette, vec2(slotIndex, 0.5)), 0.9);",
                "gl_FragColor = texture2D(palette, vec2(slotIndex, 0.5));", // Could use a single texture for all palettes and have a uniform to tell the shader which row/column to use for switching palettes
                "",
                "}"
            ].join("\n");

        var closingBraceIdx = THREE.ShaderLib['phong'].fragmentShader.lastIndexOf("}");
        THREE.ShaderLib['phong'].fragmentShader = uniforms.concat(THREE.ShaderLib['phong'].fragmentShader.substr(0, closingBraceIdx - 1)).concat(toon);
    }

    private populate_scene = (): void => {
        var loader = new THREE.JSONLoader(true);

        this.light = new THREE.DirectionalLight(0xffffff, this.intensity);
        this.light.position.set(0, 0, 0).normalize();
        this.light.position.multiplyScalar(250);
        this.scene.add(this.light);

        this.light_helper = new THREE.DirectionalLightHelper(this.light, 40);
        this.scene.add(this.light_helper);

        this.tween_light(true);

        loader.load("assets/models/city.js", this.on_model_loaded);
    }

    private on_model_loaded = (geometry:THREE.Geometry): void => {
        this.model = new THREE.Mesh(geometry, new THREE.ShaderMaterial(
        {
            lights: true,
            transparent: true,
            color: 0xffffff,
            ambient: 0xffffff,
            emissive: 0xffffff,

            wrapAround: false,
            wrapRGB: new THREE.Vector3(1, 1, 1),
            map: null,
            lightMap: null,
            specularMap: null,
            normalMap: null,
            alphaMap: null,
            envMap: null,
            bumpMap: null,
            combine: THREE.MultiplyOperation,
            vertexColors: THREE.NoColors,
            wireframe: false,
            morphTargets: false,
            morphNormals: false,
            shading: THREE.SmoothShading,
            uniforms: THREE.ShaderLib['phong'].uniforms,
            vertexShader: THREE.ShaderLib['phong'].vertexShader,
            fragmentShader: THREE.ShaderLib['phong'].fragmentShader,
            attributes: {}
        }));

        this.model.scale.set(350, 350, 350);
        this.model.material.needsUpdate = true;

        this.scene.add(this.model);
    }

    private on_texture_loaded = (texture: THREE.Texture): void => {
        texture.needsUpdate = true;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.flipY = false;

        THREE.ShaderLib["phong"].uniforms["palette"].value = texture;
    }

    private on_additional_palette_loaded = (): void => {
        this.palettes_loaded = this.palettes_loaded + 1;
    }

    private on_texture_loaded_error = (): void => {
        console.log("failed to load a texture...");
    }

    private on_light_texture_loaded = (): void => {
        this.light_sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.light_texture, color: 0xffffff, fog: false }));
        this.light_sprite.scale.set(8, 8, 1);
        this.scene.add(this.light_sprite);
    }

    private get palettes_loaded(): number {
        return this._palettes_loaded;
    }

    private set palettes_loaded(palettes: number) {
        this._palettes_loaded = palettes;

        if (this._palettes_loaded == this.num_palettes) {
            this.palette_index_change_controller = this.dat_palette_folder.add(this, "current_palette", 0, this.num_palettes).listen();
            this.palette_index_change_controller.onChange(this.on_palette_index_change);

            this.palette_name_change_controller = this.dat_palette_folder.add(this, "palette_name", this.palettes).listen();
            this.palette_name_change_controller.onChange(this.on_palette_name_change);
        }
    }

    private on_palette_index_change = (value: number): void => {
        var palette_index = Math.round(value);
        this.palette_name = this.palettes[palette_index];
        THREE.ImageUtils.loadTexture("assets/images/" + this.palette_name + ".png", THREE.Texture.DEFAULT_MAPPING, this.on_texture_loaded);
    }

    private on_palette_name_change = (name: string): void => {
        this.current_palette = this.palettes.indexOf(name);
        THREE.ImageUtils.loadTexture("assets/images/" + name + ".png", THREE.Texture.DEFAULT_MAPPING, this.on_texture_loaded);
    }

    private on_light_tween_enabled_change = (value: boolean): void => {
        this.tween_light(value);
    }

    private tween_light(value: boolean): void {
        if (value == true) {
            this.light_z = -300;
            this.light_tween = new TWEEN.Tween(this).to({ light_z: 300 }, 8000).easing(TWEEN.Easing.Sinusoidal.InOut).yoyo(true).repeat(Infinity).start();
        }
        else {
            TWEEN.remove(this.light_tween);
        }
    }

    private on_show_light_change = (value: boolean): void => {
        this.light_helper.visible = value;
        this.light_sprite.visible = value;
    }

    private on_light_intensity_change = (value: number): void => {
        this.light.intensity = value;
    }

    private render(dt : number) : void {
        this.renderstats.begin();

        if (this.enable_bloom) {
            this.effect_composer.render(dt);
        } else {
            this.renderer.render(this.scene, this.camera);
        }

        this.renderstats.end();
    }

    private update(dt : number) : void {
        this.updatestats.begin();

        if (this.rotation_enabled) {
            this.rotation.setY(this.rotation.y + dt * this.rotation_speed);
        }

        this.camera.lookAt(this.camera_target);
        this.camera.position.x = 800 * Math.sin(THREE.Math.degToRad(this.rotation.y));
        this.camera.position.z = 800 * Math.cos(THREE.Math.degToRad(this.rotation.y));

        this.light.position.set(this.light_x, this.light_y, this.light_z);
        this.light.lookAt(this.camera_target);

        if (this.light_sprite != null) {
            this.light_sprite.position.set(this.light_x, this.light_y, this.light_z);
            this.light_sprite.lookAt(this.camera_target);
        }

        this.update_input();

        TWEEN.update();

        this.updatestats.end();
    }

    private on_window_resize = (): any => {
        this.renderer_size.x = window.innerWidth;
        this.renderer_size.y = window.innerHeight - this.get_footer_height();
        this.renderer.setSize(this.renderer_size.x, this.renderer_size.y);

        this.camera.aspect = this.renderer_size.x / this.renderer_size.y;
        this.camera.updateProjectionMatrix();
    }

    private update_input(): void {
        this.input_ray.set((this.pointer_position.x / this.renderer_size.x) * 2 - 1, -(this.pointer_position.y / this.renderer_size.y) * 2 + 1, -1.0);
        this.input_ray.unproject(this.camera);
        this.input_dir.set(0, 0, -1).transformDirection(this.camera.matrixWorld);
        this.raycaster.set(this.input_ray, this.input_dir);
    }

    private on_mouse_down = (event: MouseEvent): void => {
        if (event.which !== 1) {
            return;
        }

        this.pointer_position.set(event.clientX, event.clientY);

        this.input_ray.set((event.clientX / this.renderer_size.x) * 2 - 1, -(event.clientY / this.renderer_size.y) * 2 + 1, -1.0);
        this.input_ray.unproject(this.camera);
        this.input_dir.set(0, 0, -1).transformDirection(this.camera.matrixWorld);
        this.raycaster.set(this.input_ray, this.input_dir);
    }

    private on_mouse_move = (event: MouseEvent): void => {
        this.pointer_position.set(event.clientX, event.clientY);
    }

    private on_mouse_up = (event: MouseEvent): void => {
        if (event.which !== 1) {
            return;
        }
        
        this.pointer_position.set(event.clientX, event.clientY);
    }

    private on_context_menu = (event: MouseEvent): void => {
        event.preventDefault();
    }

    private animate() : void {
        var _cb = (p:any): any => {
            var dt: number = this.main_loop_clock.getDelta();
            this.update(dt);
            this.render(dt);
            requestAnimationFrame(_cb);
        }
        _cb(this);
    }

    private get_footer_height(): number {
        var footer = <any>document.getElementsByClassName('footer_top_holder')[0];

        if (footer == null) {
            console.log("could not get footer height!");
            return 0;
        }

        return footer.clientHeight;
    }
}

window.onload = () => {
    var main: Main = new Main();
};