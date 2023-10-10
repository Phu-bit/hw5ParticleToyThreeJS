import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import Stats from 'stats.js'

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js'
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';


THREE.ColorManagement.enabled = false

/**
 * stats
 */

const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)

/**
 * Base
 */
// Debug
const gui = new dat.GUI( {width:350})
const galaxyFolder = gui.addFolder('Galaxy Tweaks')
const postGui = gui.addFolder( 'Post Processing' );
postGui.open( false );


// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const particleTexture = []
for (let i = 1; i <= 13; i++) {
    particleTexture[i] = textureLoader.load('/textures/particles/' + i + '.png');
    
}


/**
 * axes helper
 */

// const axesHelper = new THREE.AxesHelper(3)
// axesHelper.visible = false
// scene.add(axesHelper)
// gui.add(axesHelper, 'visible').name('Axes')

/**
 * Galaxy
 */
const particleParameters = {}
    particleParameters.count = 12000
    particleParameters.size = 0.05
    particleParameters.sizeAttenuation = true;
    particleParameters.blending = {type: THREE.AdditiveBlending}
    particleParameters.radius = 3
    particleParameters.branches = 10
    particleParameters.spin = 0.06;
    particleParameters.randomness = 0.2
    particleParameters.randomnessPower = 4
    particleParameters.insideColor = '#56ce46'
    particleParameters.outsideColor = '#9a634c'
    particleParameters.freeze = false
    particleParameters.method = {case: 1}
    particleParameters.speed = 0.1
    particleParameters.feedbackEnabled = false;

let particleGeo = null
let particleMat = null
let points = null

const generateGalaxy = () =>{
    console.time('particles')

    //Clear galaxy
    if (points !== null) {
        particleGeo.dispose()
        particleMat.dispose()
        scene.remove(points)
    }

    /**
     * Particle Geometry
     *  */ 
    particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleParameters.count * 3)
    const colors = new Float32Array(particleParameters.count * 3)

    const colorInside = new THREE.Color(particleParameters.insideColor)
    const colorOutside = new THREE.Color(particleParameters.outsideColor)

    for (let i = 0; i < particleParameters.count; i++) {

        //Position
        const i3 = i * 3

        //subdivisions
        const radius = Math.random() * particleParameters.radius
        const spinAngle = radius * particleParameters.spin
        const branchAngle = ((i % particleParameters.branches) / particleParameters.branches) * Math.PI * 2

        //stars xyz randomness spread
        const randomX = Math.pow(Math.random(), particleParameters.randomnessPower) * (Math.random() < 0.5 ? 1: -1) 
        const randomY = Math.pow(Math.random(), particleParameters.randomnessPower) * (Math.random() < 0.5 ? 1: -1) 
        const randomZ = Math.pow(Math.random(), particleParameters.randomnessPower) * (Math.random() < 0.5 ? 1: -1) 

        //asign values to galaxy vertex array
        positions[i3 + 0]  = Math.cos(branchAngle + spinAngle) * radius + randomX
        positions[i3 + 1]  = 0 + randomY
        positions[i3 + 2]  = Math.sin(branchAngle + spinAngle) *  radius + randomZ


    

        
        //Color
        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / particleParameters.radius)
        
        colors[i3 + 0] = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b
    }

    particleGeo.setAttribute(
        'position', 
        new THREE.BufferAttribute(positions, 3))

    particleGeo.setAttribute(
        'color', 
        new THREE.BufferAttribute(colors, 3))
    

    /**
     * Material
     */
    particleMat = new THREE.PointsMaterial({
        map: particleTexture[10],
        size: particleParameters.size,
        depthWrite: false,
        sizeAttenuation: particleParameters.sizeAttenuation,
        blending: particleParameters.blending.type,
        vertexColors: true
    })

    /**
     * points
     *
     */
    
    points = new THREE.Points(particleGeo, particleMat)
    
    scene.add(points)
    
    console.log('Galaxy Generated')
    console.timeEnd('particles')
}

generateGalaxy()

galaxyFolder.add(particleParameters, 'count').min(1000).max(30000).step(1000).onFinishChange(generateGalaxy)
galaxyFolder.add(particleParameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.add(particleParameters, 'speed').min(0.001).max(0.5).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.add(particleParameters, 'radius').min(0.01).max( 5).step(0.01).onFinishChange(generateGalaxy)
galaxyFolder.add(particleParameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
galaxyFolder.add(particleParameters, 'spin').min(-0.2).max(0.2).step(0.0001).onFinishChange(generateGalaxy)
galaxyFolder.add(particleParameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.add(particleParameters, 'randomnessPower').min(4).max(10).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.addColor(particleParameters, 'insideColor').onFinishChange(generateGalaxy)
galaxyFolder.addColor(particleParameters, 'outsideColor').onFinishChange(generateGalaxy)
galaxyFolder.add(particleParameters, 'sizeAttenuation').onFinishChange(generateGalaxy)
gui.add(particleParameters.blending, 'type', { Additive: THREE.AdditiveBlending, Subtractive: THREE.SubtractiveBlending} ).onFinishChange(generateGalaxy).name('Blending!')
gui.add(particleParameters, 'freeze').name('Freeze(freeze and zoom in for surprise)')
gui.add(particleParameters, 'method', {1: 0, 2: 1, 3: 2}).name('Variants')
galaxyFolder.open( false );
/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 5
camera.position.y = 0
camera.position.z = 0
camera.lookAt(new THREE.Vector3(0,0,0))
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const parameters = {}
parameters.backgroundColor = '#700000'

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})

renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
scene.background = new THREE.Color(parameters.backgroundColor)
gui.addColor(scene, 'background').name('Background \n- dark for additive, light for subtractive!')

/**
 * post processing
 */
const effectComposer = new EffectComposer(renderer)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height)

const renderPass = new RenderPass(scene,camera)
effectComposer.addPass(renderPass)

const afterImagePass = new AfterimagePass()
effectComposer.addPass(afterImagePass)
postGui.add( afterImagePass.uniforms[ 'damp' ], 'value', 0, 1 ).step( 0.001 );
postGui.add( particleParameters, 'feedbackEnabled' );



/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    //Fps Counter
    stats.begin()

    //Time call
    const elapsedTime = clock.getElapsedTime()

    //Update Particles
    if (!particleParameters.freeze) {


        for (let i = 0; i < particleParameters.count * 3 ; i++) {
            const i3 = i * 3
            const x = particleGeo.attributes.position.array[i3 + 0]
            const y = particleGeo.attributes.position.array[i3 + 1]
            const z = particleGeo.attributes.position.array[i3 + 2]
            const radius = Math.random() * particleParameters.radius
            const spinAngle = radius * particleParameters.spin
            const branchAngle = ((i % particleParameters.branches) / particleParameters.branches) * Math.PI * 2

            // if (i < 20) {
            //     console.log(i, branchAngle)
            // }

            const randomX = Math.pow(Math.random(), particleParameters.randomnessPower) * (Math.random() < 0.5 ? 1: -1) 
            const randomY = Math.pow(Math.random(), particleParameters.randomnessPower) * (Math.random() < 0.5 ? 1: -1) 
            const randomZ = Math.pow(Math.random(), particleParameters.randomnessPower) * (Math.random() < 0.5 ? 1: -1) 
    
            
            switch (particleParameters.method) {
                case 0:

                    
                    particleGeo.attributes.position.array[i3 + 0]  = (Math.cos((branchAngle + spinAngle) * Math.PI * (elapsedTime * particleParameters.speed)) * radius) * 
                    (Math.sin((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius) * 
                    (Math.tan((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius)
                    particleGeo.attributes.position.array[i3 + 1]  = (Math.sin((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius) * (Math.tan((branchAngle + spinAngle) * (elapsedTime * 0.1)) * radius )
                    particleGeo.attributes.position.array[i3 + 2]  = (Math.sin((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius) * (Math.cos(elapsedTime + z+ x * Math.PI) * radius )

                    break;

                case 1: 

                    particleGeo.attributes.position.array[i3 + 0]  = (Math.cos((branchAngle + spinAngle) * Math.PI * (elapsedTime * particleParameters.speed)) * radius )
                    particleGeo.attributes.position.array[i3 + 1]  = (Math.cos((z + x + branchAngle + spinAngle) * Math.PI * (elapsedTime * particleParameters.speed)) * radius )
                    particleGeo.attributes.position.array[i3 + 2]  = Math.sin((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius 

                    break

                case 2:
                     particleGeo.attributes.position.array[i3 + 0]  = (Math.tan((branchAngle + spinAngle) * Math.PI * ( elapsedTime * particleParameters.speed)) * radius + randomX) * (Math.cos((branchAngle + spinAngle)  * ( elapsedTime * 0.01 * particleParameters.speed)))
                     particleGeo.attributes.position.array[i3 + 1]  = (Math.tan((branchAngle + spinAngle) * Math.PI * ( elapsedTime * particleParameters.speed)) * radius + randomX) * 0.01 * 
                                                                      (Math.sin((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius) * radius + randomY * 
                                                                      (Math.sin((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius) * radius + randomY

                     particleGeo.attributes.position.array[i3 + 2]  = (Math.sin((branchAngle + spinAngle) * ( elapsedTime * particleParameters.speed)) * radius + randomZ) *
                                                                      (Math.cos((branchAngle + spinAngle) * Math.PI * (elapsedTime * particleParameters.speed)) * radius) * 
                                                                      (Math.tan((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius) * 0.01 * 
                                                                      (Math.tan((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius)

                    break

                default:
                    particleGeo.attributes.position.array[i3 + 0]  = (Math.cos((branchAngle + spinAngle) * Math.PI * (elapsedTime * particleParameters.speed)) * radius) * 
                                                                     (Math.sin((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius) * 
                                                                     (Math.tan((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius)
                    particleGeo.attributes.position.array[i3 + 1]  = (Math.sin((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius) * (Math.tan((branchAngle + spinAngle) * (elapsedTime * 0.1)) * radius )
                    particleGeo.attributes.position.array[i3 + 2]  = (Math.sin((branchAngle + spinAngle) * (elapsedTime * particleParameters.speed)) * radius) * (Math.cos(elapsedTime + z+ x * Math.PI) * radius )
                    break;
            }
            
        }

        particleGeo.attributes.position.needsUpdate = true
    }


    // Update controls
    controls.update()

    // Render
    //renderer.render(scene, camera)
    afterImagePass.enabled = particleParameters.feedbackEnabled
    effectComposer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    //fps counter
    stats.end()
}

tick()