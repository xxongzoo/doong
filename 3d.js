(function () {
  // Set our main variables
  let scene, renderer, camera, model, neck, waist, mixer, idle;
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const loaderAnim = document.getElementById('js-loader');

  init();
//하늘색
  function init() {
    const MODEL_PATH = 'https://doongebucket.s3.ap-northeast-2.amazonaws.com/main_nohair_color_animation_combine.glb';
    const canvas = document.querySelector('#c');
    const backgroundColor = 0xdab9ca;

    // Init the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    scene.fog = new THREE.FogExp2(0xdab9ca, 0.018);

    // Init the renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Add a camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -3, 30);

    // Load the model
    const loader = new THREE.GLTFLoader();
    loader.load(
      MODEL_PATH,
      function (gltf) {
        model = gltf.scene;
        const fileAnimations = gltf.animations;

        // Traverse the model to find bones, meshes, and other objects
        model.traverse(o => {
          console.log(o.name);  // Print the object name to the console
          if (o.isBone) {
            console.log(`Bone: ${o.name}`);  // Print the bone name to the console
            if (o.name === 'mixamorigNeckR') neck = o; 

            if (o.name === 'mixamorigSpine1R') waist = o;
          }
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }

          if (o.isBone && o.name === 'mixamorigNeckR') { 
            neck = o;
          }
          if (o.isBone && o.name === 'mixamorigSpine1R') { 
            waist = o;
          }
        });

        model.scale.set(7, 7, 7);
        model.position.y = -12.4; //높이
        scene.add(model);

        loaderAnim.remove();

        mixer = new THREE.AnimationMixer(model);

      let clips = fileAnimations.filter(val => val.name !== 'idle');
      possibleAnims = clips.map(val => {
        let clip = THREE.AnimationClip.findByName(clips, val.name);

        clip.tracks.splice(3, 3);
        clip.tracks.splice(9, 3);

        clip = mixer.clipAction(clip);
        return clip;
      });


        const idleAnim = THREE.AnimationClip.findByName(fileAnimations, 'idle');
        idleAnim.tracks.splice(3, 3);
        idleAnim.tracks.splice(9, 3);
        idle = mixer.clipAction(idleAnim);
        idle.play();
      },
      undefined,
      function (error) {
        console.error(error);
      }
    );

    // 빛
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
    dirLight.position.set(-8, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1500;
    const d = 8.25;
    dirLight.shadow.camera.left = d * -1;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = d * -1;
    scene.add(dirLight);

    // 바닥
    const floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xf1d0e1, shininess: 0 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -0.5 * Math.PI;
    floor.receiveShadow = true;
    floor.position.y = -13.5; //바닥의 높이
    scene.add(floor);

    // Start rendering loop
    update();
  }

  function update() {
    if (mixer) mixer.update(clock.getDelta());
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
    requestAnimationFrame(update);
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const canvasPixelWidth = canvas.width / window.devicePixelRatio;
    const canvasPixelHeight = canvas.height / window.devicePixelRatio;

    const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  window.addEventListener('click', e => raycast(e));
  window.addEventListener('touchend', e => raycast(e, true));

  function raycast(e, touch = false) {
    var mouse = {};
    if (touch) {
      mouse.x = 2 * (e.changedTouches[0].clientX / window.innerWidth) - 1;
      mouse.y = 1 - 2 * (e.changedTouches[0].clientY / window.innerHeight);
    } else {
      mouse.x = 2 * (e.clientX / window.innerWidth) - 1;
      mouse.y = 1 - 2 * (e.clientY / window.innerHeight);
    }
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects[0]) {
      var object = intersects[0].object;
//이름
      if (object.name === '큐브') {

        if (!currentlyAnimating) {
          currentlyAnimating = true;
          playOnClick();
        }
      }
    }
  }

  // Get a random animation, and play it 
  function playOnClick() {
    let anim = Math.floor(Math.random() * possibleAnims.length) + 0;
    playModifierAnimation(idle, 0.25, possibleAnims[anim], 0.25);
  }


  function playModifierAnimation(from, fSpeed, to, tSpeed) {
    to.setLoop(THREE.LoopOnce);
    to.reset();
    to.play();
    from.crossFadeTo(to, fSpeed, true);
    setTimeout(function () {
      from.enabled = true;
      to.crossFadeTo(from, tSpeed, true);
      currentlyAnimating = false;
    }, to._clip.duration * 1000 - (tSpeed + fSpeed) * 1000);
  }


  document.addEventListener('mousemove', function (e) {
    const mousecoords = getMousePos(e);
    if (neck && waist) {
      moveJoint(mousecoords, neck, 38);
      moveJoint(mousecoords, waist, 15);
    }
  });

  function getMousePos(e) {
    return { x: e.clientX, y: e.clientY };
  }

  function moveJoint(mouse, joint, degreeLimit) {
    const degrees = getMouseDegrees(mouse.x, mouse.y, degreeLimit);
    joint.rotation.y = THREE.Math.degToRad(degrees.x);
    joint.rotation.x = THREE.Math.degToRad(degrees.y);
  }

  function getMouseDegrees(x, y, degreeLimit) {
    let dx = 0, dy = 0;
    const w = { x: window.innerWidth, y: window.innerHeight };

    if (x <= w.x / 2) {
      const xdiff = w.x / 2 - x;
      const xPercentage = (xdiff / (w.x / 2)) * 100;
      dx = ((degreeLimit * xPercentage) / 100) * -1;
    } else {
      const xdiff = x - w.x / 2;
      const xPercentage = (xdiff / (w.x / 2)) * 100;
      dx = (degreeLimit * xPercentage) / 100;
    }

    if (y <= w.y / 2) {
      const ydiff = w.y / 2 - y;
      const yPercentage = (ydiff / (w.y / 2)) * 100;
      dy = (((degreeLimit * 0.5) * yPercentage) / 100) * -1;
    } else {
      const ydiff = y - w.y / 2;
      const yPercentage = (ydiff / (w.y / 2)) * 100;
      dy = (degreeLimit * yPercentage) / 100;
    }

    return { x: dx, y: dy };
  }
})();
