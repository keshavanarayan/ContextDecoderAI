/* eslint no-undef: "off", no-unused-vars: "off" */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/TransformControls.js'
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/3DMLoader.js'
import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js'

// set up loader for converting the results to threejs
const loader = new Rhino3dmLoader()
loader.setLibraryPath( 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/' )

const definition = 'FinalInterface_final.gh'

// setup input change events
const amenities_slider = document.getElementById( 'RH_IN:SelectAmenities' )
amenities_slider.addEventListener( 'mouseup', onSliderChange, false )
amenities_slider.addEventListener( 'touchend', onSliderChange, false )
const analysistype_slider = document.getElementById( 'RH_IN:AnalysisType' )
analysistype_slider.addEventListener( 'mouseup', onSliderChange, false )
analysistype_slider.addEventListener( 'touchend', onSliderChange, false )
const radius_slider = document.getElementById( 'RH_IN:Radius' )
radius_slider.addEventListener( 'mouseup', onSliderChange, false )
radius_slider.addEventListener( 'touchend', onSliderChange, false )


const displayanalysis_checkbox = document.querySelector('input[id="RH_IN:DisplayAnalysis"]');
displayanalysis_checkbox.addEventListener( 'change', onSliderChange, false )
const textdisplay_checkbox = document.querySelector('input[id="RH_IN:TextDisplay"]');
textdisplay_checkbox.addEventListener( 'change', onSliderChange, false )



let points = []

let rhino, doc

rhino3dm().then(async m => {
  console.log('Loaded rhino3dm.')
  rhino = m // global

  init()
  rndPts()
  loadContext()
  compute()
})


function rndPts() {
  // generate random points
  const x = 90
  const y = 67
  const z = 0
  const pt = "{\"X\":" + x + ",\"Y\":" + y + ",\"Z\":" + z + "}"
  console.log( `x ${x} y ${y}` )
  points.push(pt)
  const icoGeo = new THREE.IcosahedronGeometry(1)
  const icoMat = new THREE.MeshNormalMaterial()
  const ico = new THREE.Mesh( icoGeo, icoMat )
  ico.name = 'ico'
  ico.position.set( x, y, z)
  scene.add( ico )
  let tcontrols = new TransformControls( camera, renderer.domElement )
  tcontrols.enabled = true
  tcontrols.attach( ico )
  tcontrols.showZ = false
  tcontrols.addEventListener( 'dragging-changed', onChange )
  scene.add(tcontrols)
  
}


let dragging = false
function onChange() {
  dragging = ! dragging
  if (!dragging) {
    // update points position
    points = []
    scene.traverse(child => {
      if ( child.name === 'ico' ) {
        const pt = "{\"X\":" + child.position.x + ",\"Y\":" + child.position.y + ",\"Z\":" + child.position.z + "}"
        points.push( pt )
        console.log(pt)
      
      }
    }, false)

    compute()
    controls.enabled = true
    return
  }
  controls.enabled = false
}
  
/**
 * Call appserver
 */
async function compute () {

  showSpinner(true)

  // initialise 'data' object that will be used by compute()
  const data = {
    definition: definition,
    inputs: {
      'RH_IN:SelectAmenities': amenities_slider.valueAsNumber,
      'RH_IN:AnalysisType': analysistype_slider.valueAsNumber,
      'RH_IN:Radius': radius_slider.valueAsNumber,

      'RH_IN:DisplayAnalysis': displayanalysis_checkbox.checked,


      'points': points
    }
  }

  console.log(data.inputs)

  const request = {
    'method':'POST',
    'body': JSON.stringify(data),
    'headers': {'Content-Type': 'application/json'}
  }

  try {
    const response = await fetch('/solve', request)

    if(!response.ok)
      throw new Error(response.statusText)

    const responseJson = await response.json()
    collectResults(responseJson)

  } catch(error){
    console.error(error)
  }
}

/**
 * Parse response
 */
 function collectResults(responseJson) {

  const values = responseJson.values

  console.log(values)

  // clear doc
  try {
    if( doc !== undefined)
        doc.delete()
  } catch {}



  doc = new rhino.File3dm()


  // for each output (RH_OUT:*)...
  for ( let i = 0; i < values.length; i ++ ) {
    // ...iterate through data tree structure...
    for (const path in values[i].InnerTree) {
      const branch = values[i].InnerTree[path]
      // ...and for each branch...
      for( let j = 0; j < branch.length; j ++) {
        // ...load rhino geometry into doc
        const rhinoObject = decodeItem(branch[j])
        if (rhinoObject !== null) {
          // console.log(rhinoObject)
          doc.objects().add(rhinoObject, null)
        }
      }
    }
  }

  if (doc.objects().count < 1) {
    console.error('No rhino objects to load!')
    showSpinner(false)
    return
  }


  // load rhino doc into three.js scene
  const buffer = new Uint8Array(doc.toByteArray()).buffer
  loader.parse( buffer, function ( object ) 
  {

  
      // clear objects from scene
      scene.traverse(child => {
        if ( child.userData.hasOwnProperty( 'objectType' ) && child.name !== 'context') {
          scene.remove( child )
        }
      })

      ///////////////////////////////////////////////////////////////////////
      
      // color crvs
      object.traverse(child => {
        if (child.isLine) {
          if (child.userData.attributes.geometry.userStringCount > 0) {
            //console.log(child.userData.attributes.geometry.userStrings[0][1])
            const col = child.userData.attributes.geometry.userStrings[0][1]
            const threeColor = new THREE.Color( "rgb(" + col + ")")
            const mat = new THREE.LineBasicMaterial({color:threeColor})
            child.material = mat
          }
        }
      })

      ///////////////////////////////////////////////////////////////////////
      // add object graph from rhino model to three.js scene
      scene.add( object )

      // hide spinner and enable download button
      showSpinner(false)
      //downloadButton.disabled = false

  })
}

/**
* Attempt to decode data tree item to rhino geometry
*/
function decodeItem(item) {
const data = JSON.parse(item.data)
if (item.type === 'System.String') {
  // hack for draco meshes
  try {
      return rhino.DracoCompression.decompressBase64String(data)
  } catch {} // ignore errors (maybe the string was just a string...)
} else if (typeof data === 'object') {
  return rhino.CommonObject.decode(data)
}
return null
}

/**
 * Called when a slider value changes in the UI. Collect all of the
 * slider values and call compute to solve for a new scene
 */
function onSliderChange () {
  // show spinner

  showSpinner(true)
  compute()
}

/**
 * Shows or hides the loading spinner
 */
 function showSpinner(enable) {
  if (enable)
    document.getElementById('loader').style.display = 'block'
  else
    document.getElementById('loader').style.display = 'none'
}

// BOILERPLATE //

var scene, camera, renderer, controls
function init() 
{
  // Rhino models are z-up, so set this as the default
  THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 );

  scene = new THREE.Scene()
  scene.background = new THREE.Color("rgb(255, 255, 255)")
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 10000 )
  camera.position.x = 100
  camera.position.y = 100
  camera.position.z = 50

  renderer = new THREE.WebGLRenderer({antialias: true})
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )
  document.body.appendChild(renderer.domElement)

  controls = new OrbitControls( camera, renderer.domElement  )
  controls.target.set(30, 39, -5);

  // add a directional light
  const directionalLight = new THREE.DirectionalLight( 0xffffff )
  directionalLight.intensity = 2
  scene.add( directionalLight )
 
 
  const ambientLight = new THREE.AmbientLight()
  scene.add( ambientLight )

  window.addEventListener( 'resize', onWindowResize, false )

  animate()
}

var animate = function () {
  requestAnimationFrame( animate )
  renderer.render( scene, camera )
}
  
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )
  animate()
}


function loadContext() {
  loader.load('context.3dm', function (object) {
    object.traverse(child => {
      child.name = 'context'
    })
    scene.add(object)
  })
}

/**
 * Helper function that behaves like rhino's "zoom to selection", but for three.js!
 */
 function zoomCameraToSelection( camera, controls, selection, fitOffset = 1.2 ) {
  
  const box = new THREE.Box3();
  
  for( const object of selection ) {
    if (object.isLight) continue
    box.expandByObject( object );
  }
  
  const size = box.getSize( new THREE.Vector3() );
  const center = box.getCenter( new THREE.Vector3() );
  
  const maxSize = Math.max( size.x, size.y, size.z );
  const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * camera.fov / 360 ) );
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max( fitHeightDistance, fitWidthDistance );
  
  const direction = controls.target.clone()
    .sub( camera.position )
    .normalize()
    .multiplyScalar( distance );
  controls.maxDistance = distance * 10;
  controls.target.copy( center );
  
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  camera.position.copy( controls.target ).sub(direction);
  
  controls.update();
}