import { Application, ICanvas } from "pixi.js";
import { ResizeManager } from "src/app/game/src/scenes/ResizeManager";

export interface IGame extends Application {
    dimensions?: Dimensions,
    resizeManager?: ResizeManager,
    addAnywhereListener?: Function,
    removeAnywhereListener?: Function
}

interface Dimensions {
    windowWidth: number,
    windowHeight: number,
    stageWidth: number,
    stageHeight: number
}