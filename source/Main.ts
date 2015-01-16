class Main {
    private renderstats: Stats = new Stats();
    private updatestats: Stats = new Stats();

    private main_loop_clock: THREE.Clock;
    private renderer: THREE.Renderer;
    private created: boolean = false;

    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;

    private raycaster: THREE.Raycaster;
    private input_ray: THREE.Vector3;
    private input_dir: THREE.Vector3;

    private camera_target: THREE.Vector3;

    private pointer_position: THREE.Vector2;

    private renderer_size: THREE.Vector2;

    private model: THREE.Mesh;
    private rotation: THREE.Vector3 = new THREE.Vector3();
    private palette: THREE.Texture;

    private directional_light: THREE.DirectionalLight;
    private point_light: THREE.PointLight;

    private dat: dat.GUI;
    private rotation_enabled: boolean = true;
    private rotation_speed: number = 2;

    private light_x: number = 0;
    private light_y: number = 350;
    private light_z: number = -200;

    private light_tween: TWEEN.Tween;
    private light_tweening_enabled: boolean = false;

    private texture_change_controller: dat.GUIController;

    private num_palettes: number = 10;
    private _palettes_loaded: number = 0;
    private current_palette: number = 0;

    constructor () {
        this.create();

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

        this.animate();
    }

    private get_footer_height(): number {
        var footer = <any>document.getElementsByClassName('footer_top_holder')[0];

        if (footer == null) {
            console.log("could not get footer height!");
            return 0;
        }

        return footer.clientHeight;
    }

    private setup_options(): void {
        this.dat = new dat.GUI();
        this.dat.add(this, "rotation_enabled", true);
        this.dat.add(this, "rotation_speed", 2, 15);
        this.dat.add(this, "light_tweening_enabled", false).onChange(this.on_light_tween_enabled_change);
        this.dat.add(this, "light_x", -200, 300).listen();
        this.dat.add(this, "light_y",  200, 400).listen();
        this.dat.add(this, "light_z", -200, 200).listen();
    }

    private on_light_tween_enabled_change = (value: boolean): void => {
        if (value == true) {
            this.light_z = -200;
            this.light_tween = new TWEEN.Tween(this).to({ light_z: 200 }, 8000).easing(TWEEN.Easing.Sinusoidal.InOut).yoyo(true).repeat(Infinity).start().onUpdate(this.on_light_tween_update);
        }
        else {
            TWEEN.remove(this.light_tween);
        }
    }

    private on_light_tween_update = (value:number): void => {
        this.current_palette = Math.round(value * this.num_palettes);
        this.on_palette_change(this.current_palette);
    }

    private setup_shader(): void {
        THREE.ShaderLib['lambert'].uniforms = THREE.UniformsUtils.merge([
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
                "gl_FragColor = texture2D(palette, vec2(slotIndex, 0.5));",
                "",
                "}"
            ].join("\n");

        var closingBraceIdx = THREE.ShaderLib['lambert'].fragmentShader.lastIndexOf("}");
        THREE.ShaderLib['lambert'].fragmentShader = uniforms.concat(THREE.ShaderLib['lambert'].fragmentShader.substr(0, closingBraceIdx - 1)).concat(toon);
    }

    private create(): void {
        if (!this.created) {
            this.main_loop_clock = new THREE.Clock(true);

            this.renderer_size = new THREE.Vector2(window.innerWidth, window.innerHeight - this.get_footer_height());

            var webgl_support = WebGLDetector.detect();

            if (webgl_support === WebGLSupport.SUPPORTED_AND_ENABLED) {
                this.create_webgl_scene();

                this.camera_target = new THREE.Vector3(0, 150, 0);
                this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
                this.camera.position.y = 800;

                this.scene = new THREE.Scene();
                this.populate_scene();
                this.setup_shader();

                this.palette = THREE.ImageUtils.loadTexture("assets/images/palette0.png", new THREE.UVMapping(), this.on_texture_loaded);
                for (var i = 1; i <= this.num_palettes; i++) {
                    THREE.ImageUtils.loadTexture("assets/images/palette" + i.toString() + ".png", new THREE.UVMapping(), this.on_additional_palette_loaded);
                }

                var container = document.createElement('div');
                document.body.appendChild(container);
                var info = document.createElement('div');
                info.style.position = 'absolute';
                info.style.top = '20px';
                info.style.width = '100%';
                info.style.textAlign = 'center';
                info.style.color = 'white';
                info.innerHTML = 'single pass palette <a href="http://samcodes.co.uk/" target="_blank">shader</a>. model is chiba city blues by <a href="http://www.cs.columbia.edu/~keenan/Projects/ModelRepository/">keenan crane</a>.';
                container.appendChild(info);

                this.setup_options();
            } else {
                this.create_canvas_scene();
            }

            this.created = true;
        }
    }

    private populate_scene = (): void => {
        var loader = new THREE.JSONLoader(true);

        this.directional_light = new THREE.DirectionalLight(0xffffff, 2);
        this.directional_light.position.set(0, 0, 0).normalize();
        this.directional_light.position.multiplyScalar(250);
        this.scene.add(this.directional_light);

        var helper = new THREE.DirectionalLightHelper(this.directional_light, 150);
        this.scene.add(helper);

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
                uniforms: THREE.ShaderLib['lambert'].uniforms,
                vertexShader: THREE.ShaderLib['lambert'].vertexShader,
                fragmentShader: THREE.ShaderLib['lambert'].fragmentShader,
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

        THREE.ShaderLib["lambert"].uniforms["palette"].value = texture;
    }

    private on_additional_palette_loaded = (): void => {
        this.palettes_loaded = this.palettes_loaded + 1;
    }

    private get palettes_loaded(): number {
        return this._palettes_loaded;
    }

    private set palettes_loaded(palettes: number) {
        this._palettes_loaded = palettes;

        if (this._palettes_loaded == this.num_palettes) {
            this.texture_change_controller = this.dat.add(this, "current_palette", 0, this.num_palettes).listen();
            this.texture_change_controller.onChange(this.on_palette_change);
        }
    }

    private on_palette_change = (value: number): void => {
        var palette_value = Math.round(value);
        THREE.ImageUtils.loadTexture("assets/images/palette" + palette_value.toString() + ".png", new THREE.UVMapping(), this.on_texture_loaded);
    }

    private create_webgl_scene(): void {
        var gl_renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
        gl_renderer.setSize(this.renderer_size.x, this.renderer_size.y + 1);
        gl_renderer.autoClear = true;
        gl_renderer.gammaInput = true;
        gl_renderer.gammaOutput = true;
        gl_renderer.setClearColor(new THREE.Color(0, 0, 0));
        this.renderer = gl_renderer;

        var div = document.getElementById("background");
        div.appendChild(this.renderer.domElement);

        var left: number = 0;
        var right: number = this.renderer_size.x;
        var top: number = this.renderer_size.y;
        var bottom: number = 0;

        this.raycaster = new THREE.Raycaster();
        this.input_ray = new THREE.Vector3();
        this.input_dir = new THREE.Vector3();

        this.pointer_position = new THREE.Vector2(9999, 9999);

        window.addEventListener('resize', this.on_window_resize, false);

        document.addEventListener('contextmenu', this.on_context_menu, false);
        this.renderer.domElement.addEventListener('mousedown', this.on_mouse_down, false);
        this.renderer.domElement.addEventListener('mousemove', this.on_mouse_move, false);
        this.renderer.domElement.addEventListener('mouseup', this.on_mouse_up, false);
    }

    private create_canvas_scene(): void {
        var div = document.getElementById("background");

        var p = document.createElement("p");
        var node = document.createTextNode("This site requires WebGL");
        p.appendChild(node);

        div.appendChild(p);
    }

    private render(dt : number) : void {
        this.renderstats.begin();

        this.renderer.render(this.scene, this.camera);

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

        this.directional_light.position.set(this.light_x, this.light_y, this.light_z);
        this.directional_light.lookAt(this.camera_target);

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
}

window.onload = () => {
    var main: Main = new Main();
};