import * as PIXI from 'pixi.js';

interface Star extends PIXI.Sprite {
  speed: number;
}

type GameData = {
  initialized: boolean,
  WIDTH: number,
  HEIGHT: number,
  ALPHA_MIN: number,
  ALPHA_MAX: number,
  ALPHA_CALC: number,
  ANGLE: number,
  ANGLE_TAN: number,
  WIDTH_CALC: number,
  OFFSETX: number,
  OFFSETY: number,
  NUM_STARS: number,
  pointerHovering: boolean,
  lastPointerIntersection: number,
  stars: Star[],
  app: PIXI.Application | null,
  updateContainer: (container: HTMLDivElement) => void,
  initialize: () => void,
  loop: (deltaTime: number) => void,
  mapDistanceToAlpha: (dist: number) => number,
  setAlphas: (event: PointerEvent, reset: boolean) => void,
  onHover: (event: PointerEvent) => void,
  onMove: (event: PointerEvent) => void,
  onLeave: (event: PointerEvent) => void,
  resize: () => void,
};

let FallingStarsGameData: GameData | undefined;
if (FallingStarsGameData === undefined) {
  FallingStarsGameData = {
    initialized: false,
    WIDTH: 1920,
    HEIGHT: 1080,
    ALPHA_MIN: 0.3,
    ALPHA_MAX: 0.8,
    ALPHA_CALC: 0.5,
    ANGLE: Math.PI/5,
    ANGLE_TAN: Math.tan(Math.PI/5),
    WIDTH_CALC: 0,
    OFFSETX: 0,
    OFFSETY: 0,
    NUM_STARS: 0,
    pointerHovering: false,
    lastPointerIntersection: 0,
    stars: [],
    app: null,
    updateContainer: (container) => {
      if (FallingStarsGameData === undefined) return;
      if (container === null) {
        if (FallingStarsGameData.app !== null) FallingStarsGameData.app.ticker.stop();
        return;
      }
      if (container.parentElement === null) throw Error("Falling-stars container needs to have a parent element.");
      FallingStarsGameData.WIDTH = container.parentElement.clientWidth;
      FallingStarsGameData.HEIGHT = container.parentElement.clientHeight;
      FallingStarsGameData.WIDTH_CALC = FallingStarsGameData.WIDTH + FallingStarsGameData.ANGLE_TAN * FallingStarsGameData.HEIGHT;
      FallingStarsGameData.OFFSETX = 0;
      FallingStarsGameData.OFFSETY = 0;
      let el = container;
      while (el !== null) {
        FallingStarsGameData.OFFSETX += el.offsetLeft;
        FallingStarsGameData.OFFSETY += el.offsetTop;
        // @ts-ignore
        el = el.offsetParent;
      }
      if (FallingStarsGameData.app === null) {
        FallingStarsGameData.app = new PIXI.Application({
          width: FallingStarsGameData.WIDTH,
          height: FallingStarsGameData.HEIGHT,
          antialias: true,
          sharedTicker: true,
          backgroundAlpha: 0,
          autoStart: true,
        });
        FallingStarsGameData.initialize();
        FallingStarsGameData.app.stage.addChild(...FallingStarsGameData.stars);
        FallingStarsGameData.app.ticker.add(FallingStarsGameData.loop);
      } else {
        FallingStarsGameData.app.view.width = FallingStarsGameData.WIDTH;
        FallingStarsGameData.app.view.height = FallingStarsGameData.HEIGHT;
        FallingStarsGameData.app.ticker.start();
      }
      container.appendChild(FallingStarsGameData.app.view);
      container.parentElement.addEventListener('pointerenter', FallingStarsGameData.onHover);
    },
    initialize: () => {
      if (FallingStarsGameData === undefined || FallingStarsGameData.app === null) return;
      const width = FallingStarsGameData.WIDTH;
      const height = FallingStarsGameData.HEIGHT;
      // Initialize all possible star graphics
      const starGraphics = [];
      const starColors = [0x1AB2FF, 0x1AFF8C, 0x40FF1A, 0x33DDFF];
      const starStreaks = [height, height/2, height/4, height/8];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const starGraphic = new PIXI.Graphics()
            .moveTo(0, 0)
            .lineStyle(4, starColors[i])
            .lineTo(FallingStarsGameData.ANGLE_TAN * starStreaks[j], -starStreaks[j])
            .closePath();
          starGraphics.push(FallingStarsGameData.app.renderer.generateTexture(starGraphic));
        }
      }
      // Initialize array of stars
      FallingStarsGameData.NUM_STARS = (width < 600 || height < 600) ? 30 : 60;
      for (let i = 0; i < FallingStarsGameData.NUM_STARS; i++) {
        // @ts-ignore
        FallingStarsGameData.stars[i] = new PIXI.Sprite(starGraphics[Math.floor(Math.random() * 16)]);
        FallingStarsGameData.stars[i].anchor.set(0, 1);
        FallingStarsGameData.stars[i].scale.set(0.5);
        FallingStarsGameData.stars[i].alpha = FallingStarsGameData.ALPHA_MIN;
        FallingStarsGameData.stars[i].x = Math.random() * FallingStarsGameData.WIDTH_CALC;
        FallingStarsGameData.stars[i].y = Math.random() * (height*2) - (height*1.2);
        FallingStarsGameData.stars[i].speed = Math.random()*(0.0065*height - 2) + 2;
      }
    },
    loop: (deltaTime) => {
      if (FallingStarsGameData === undefined) return;
      for (let i = FallingStarsGameData.NUM_STARS-1; i >= 0; i--) {
        const movement = FallingStarsGameData.stars[i].speed * deltaTime;
        FallingStarsGameData.stars[i].x -= FallingStarsGameData.ANGLE_TAN * movement;
        FallingStarsGameData.stars[i].y += movement;
        if (FallingStarsGameData.stars[i].y - FallingStarsGameData.stars[i].height > FallingStarsGameData.HEIGHT 
            || FallingStarsGameData.stars[i].x + FallingStarsGameData.stars[i].width < 0) {
          FallingStarsGameData.stars[i].x = Math.random() * FallingStarsGameData.WIDTH_CALC;
          FallingStarsGameData.stars[i].y = 0;
          if (FallingStarsGameData.pointerHovering) FallingStarsGameData.stars[i].alpha = 
            FallingStarsGameData.mapDistanceToAlpha(Math.abs(FallingStarsGameData.lastPointerIntersection - FallingStarsGameData.stars[i].x));
        }
      }
    },
    mapDistanceToAlpha: (dist) => {
      // @ts-ignore
      if (dist > FallingStarsGameData.WIDTH) return FallingStarsGameData.ALPHA_MIN;
      // @ts-ignore
      let c = (1 - dist/FallingStarsGameData.WIDTH);
      // @ts-ignore
      return (FallingStarsGameData.ALPHA_MIN + c*c*c*c*FallingStarsGameData.ALPHA_CALC);
    },
    setAlphas: (event, reset) => {
      if (FallingStarsGameData === undefined) return;
      if (reset) {
        for (let i = FallingStarsGameData.NUM_STARS-1; i >= 0; i--) {
          FallingStarsGameData.stars[i].alpha = 0.4;
        }
      } else {
        const posX = event.pageX - FallingStarsGameData.OFFSETX;
        const posY = event.pageY - FallingStarsGameData.OFFSETY;
        // calculate where intersection point (when y = 0) would be if a line that tilts
        // just like the falling stars would be drawn through pointer position
        const pointerIntersection = posX + FallingStarsGameData.ANGLE_TAN * posY;
        for (let i = FallingStarsGameData.NUM_STARS-1; i >= 0; i--) {
          // calculate similar intersection for star (i.e. if star had y = 0, what would be its x?)
          const starIntersection = FallingStarsGameData.stars[i].x + FallingStarsGameData.ANGLE_TAN * FallingStarsGameData.stars[i].y;
          FallingStarsGameData.stars[i].alpha = FallingStarsGameData.mapDistanceToAlpha(Math.abs(pointerIntersection - starIntersection));
        }
        FallingStarsGameData.lastPointerIntersection = pointerIntersection;
      }
    },
    onHover: (event) => {
      if (FallingStarsGameData === undefined || FallingStarsGameData.app === null) return;
      FallingStarsGameData.app.view.parentElement?.parentElement?.addEventListener('pointermove', FallingStarsGameData.onMove);
      FallingStarsGameData.app.view.parentElement?.parentElement?.addEventListener('pointerleave', FallingStarsGameData.onLeave);
      FallingStarsGameData.setAlphas(event, false);
      FallingStarsGameData.pointerHovering = true;
    },
    onMove: (event) => {
      if (FallingStarsGameData === undefined || FallingStarsGameData.app === null) return;
      FallingStarsGameData.setAlphas(event, false);
    },
    onLeave: (event) => {
      if (FallingStarsGameData === undefined || FallingStarsGameData.app === null) return;
      FallingStarsGameData.app.view.parentElement?.parentElement?.removeEventListener('pointermove', FallingStarsGameData.onMove);
      FallingStarsGameData.app.view.parentElement?.parentElement?.removeEventListener('pointerleave', FallingStarsGameData.onLeave);
      FallingStarsGameData.setAlphas(event, true);
      FallingStarsGameData.pointerHovering = false;
    },
    resize: () => {
      if (FallingStarsGameData === undefined || FallingStarsGameData.app === null 
        || FallingStarsGameData.app.view.parentElement === null || FallingStarsGameData.app.view.parentElement.parentElement === null) return;
      FallingStarsGameData.WIDTH = FallingStarsGameData.app.view.parentElement.parentElement.clientWidth;
      FallingStarsGameData.HEIGHT = FallingStarsGameData.app.view.parentElement.parentElement.clientHeight;
      FallingStarsGameData.WIDTH_CALC = FallingStarsGameData.WIDTH + FallingStarsGameData.ANGLE_TAN * FallingStarsGameData.HEIGHT;
      FallingStarsGameData.app.renderer.resize(FallingStarsGameData.WIDTH, FallingStarsGameData.HEIGHT);
    }
  }
  window.addEventListener('resize', FallingStarsGameData.resize);
}
