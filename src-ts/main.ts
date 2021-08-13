import * as PIXI from 'pixi.js';

const VIEW = document.getElementById('falling-stars');
if (VIEW === null) throw Error("No element found with id 'falling-stars'.");
if (!(VIEW instanceof HTMLCanvasElement)) throw Error("Element with id 'falling-stars' is not a canvas element.");
const PARENT = VIEW.parentElement;
if (PARENT === null) throw Error("Falling-stars canvas needs to have a parent element.");
let WIDTH = PARENT.clientWidth;
let HEIGHT = PARENT.clientHeight;
VIEW.width = WIDTH;
VIEW.height = HEIGHT;
const ANGLE = Math.PI/5;
const ANGLE_TAN = Math.tan(ANGLE);
const WIDTH_CALC = WIDTH + ANGLE_TAN * HEIGHT;
let OFFSETX = 0;
let OFFSETY = 0;
{
  let el = VIEW;
  while (el !== null) {
    OFFSETX += el.offsetLeft;
    OFFSETY += el.offsetTop;
    // @ts-ignore
    el = el.offsetParent;
  }
}
let pointerHovering = false;
let lastPointerIntersection: number;

// Application
const app = new PIXI.Application({
  width: WIDTH,
  height: HEIGHT,
  view: VIEW,
  antialias: true,
  sharedTicker: true,
  backgroundAlpha: 0,
  autoStart: true,
});

// Initialize all possible star graphics
const starGraphics = [];
const starColors = [0x1AB2FF, 0x1AFF8C, 0x40FF1A, 0x33DDFF];
const starStreaks = [HEIGHT, HEIGHT/2, HEIGHT/4, HEIGHT/8];
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    const starGraphic = new PIXI.Graphics()
      .moveTo(0, 0)
      .lineStyle(0.002*WIDTH, starColors[i])
      .lineTo(ANGLE_TAN * starStreaks[j], -starStreaks[j])
      .closePath();
    starGraphics.push(app.renderer.generateTexture(starGraphic));
  }
}

interface Star extends PIXI.Sprite {
  speed: number;
}

// Initialize array of stars
const stars: Star[] = [];
const numStars = 100;
for (let i = 0; i < numStars; i++) {
  // @ts-ignore
  stars[i] = new PIXI.Sprite(starGraphics[Math.floor(Math.random() * 16)]);
  stars[i].anchor.set(0, 1);
  stars[i].scale.set(0.5);
  stars[i].alpha = 0.4;
  stars[i].x = Math.random() * WIDTH_CALC;
  stars[i].y = Math.random() * (HEIGHT*2) - (HEIGHT*1.2);
  stars[i].speed = Math.random()*5 + 2;
}

function loop() {
  for (let i = numStars-1; i >= 0; i--) {
    stars[i].x -= ANGLE_TAN * stars[i].speed;
    stars[i].y += stars[i].speed;
    if (stars[i].y - stars[i].height > HEIGHT || stars[i].x + stars[i].width < 0) {
      stars[i].x = Math.random() * WIDTH_CALC;
      stars[i].y = 0;
      if (pointerHovering) stars[i].alpha = mapDistanceToAlpha(Math.abs(lastPointerIntersection - stars[i].x));
    }
  }
}

app.stage.addChild(...stars);
app.ticker.add(loop);

PARENT.addEventListener('pointerenter', onHover);

function onHover(event: PointerEvent) {
  PARENT?.addEventListener('pointermove', onMove);
  PARENT?.addEventListener('pointerleave', onLeave);
  setAlphas(event);
  pointerHovering = true;
}

function onMove(event: PointerEvent) {
  setAlphas(event);
}

function onLeave(event: PointerEvent) {
  PARENT?.removeEventListener('pointermove', onMove);
  PARENT?.removeEventListener('pointerleave', onLeave);
  setAlphas(event, true);
  pointerHovering = false;
}

function setAlphas(event: PointerEvent, reset: boolean = false) {
  if (reset) {
    for (let i = numStars-1; i >= 0; i--) {
      stars[i].alpha = 0.4;
    }
  } else {
    const posX = event.pageX - OFFSETX;
    const posY = event.pageY - OFFSETY;
    // calculate where intersection point (when y = 0) would be if a line that tilts
    // just like the falling stars would be drawn through pointer position
    const pointerIntersection = posX + ANGLE_TAN * posY;
    for (let i = numStars-1; i >= 0; i--) {
      // calculate similar intersection for star (i.e. if star had y = 0, what would be its x?)
      const starIntersection = stars[i].x + ANGLE_TAN * stars[i].y;
      stars[i].alpha = mapDistanceToAlpha(Math.abs(pointerIntersection - starIntersection));
    }
    lastPointerIntersection = pointerIntersection;
  }
}

function mapDistanceToAlpha(dist: number) {
  if (dist > WIDTH) return 0.4;
  let c = (1 - dist/WIDTH);
  return (0.4 + c*c*c*c*0.6);
}

function resize() {
  if (VIEW instanceof HTMLCanvasElement && PARENT != null) {
    WIDTH = PARENT.clientWidth;
    HEIGHT = PARENT.clientHeight;
    VIEW.width = WIDTH;
    VIEW.height = HEIGHT;
    app.renderer.resize(WIDTH, HEIGHT);
  }
}

window.addEventListener('resize', resize);
resize();
