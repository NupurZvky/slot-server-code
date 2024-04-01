import { Container, Texture } from "pixi.js";
import { Symbol } from "src/app/game/components/reels/Symbol";
import { GameEventsManager } from "../events/eventsManager";
import { GameEvents } from "../events/gameEvents";

export class SymbolsAnimationsManager {
    private currentAnimations:SymbolAnimation[] = [];
    // symbol textures could be animated sprites or spines
    constructor(private animationsContainer: Container, private dispatcher: GameEventsManager, private lockedSymbolsContainer: Container, private reelsContainer: Container) {
        this.dispatcher.addListener(GameEvents.CLEAR_SYMBOL_ANIMATIONS, this.clearWinAnimations, this);
    }

    /**
     * @param symbol The actual symbol to animate
     * @param animationType - The type of animation like, "landing", "winning"
     * 
     */
    playSymbolAnimation(symbol: Symbol, withWinBox = false) {
        
        let animation: SymbolAnimation = symbol.clone();
        animation.baseSymbol = symbol;
        animation.highPrioritySymbol = this.lockedSymbolsContainer.getChildByName(symbol.uniqueId || "") as Symbol | undefined;
        const animationLayer = this.animationsContainer as Container;
        animationLayer && animationLayer.addChild(animation);
        this.currentAnimations.push(animation);
        animation.pivot.set(symbol.pivot.x, symbol.pivot.y);
        animation.scale.set(symbol.scale.x, symbol.scale.y);
        animation.x = symbol.x + (symbol.parent.parent.x / symbol.parent.parent.scale.x);
        animation.y = symbol.y + (symbol.parent.parent.y / symbol.parent.parent.scale.y);
        animation.highPrioritySymbol && (animation.highPrioritySymbol.alpha = 0);
        animation.baseSymbol && (animation.baseSymbol.alpha = 0);
        return animation.playWinAnimation(withWinBox);
    }

    playAllSymbolsAnimations(symbols: Symbol[], allSymbols: Symbol[], withWinBox = false) {
        // this.reelsContainer.alpha = 0.5;
        // this.lockedSymbolsContainer.alpha = 0.5;
        // @ts-expect-error
        this.reelsContainer.parent.getChildByName("reelsAnimationOverlay").alpha = 0.65;
        const promises: Promise<any>[] = [];
        symbols.forEach(symbol => {
            promises.push(this.playSymbolAnimation(symbol, withWinBox));
        });
        allSymbols.forEach(symbol => {
            symbol.dimSymbol();
        });
        return Promise.all(promises);
    }

    clearWinAnimations(allSymbols: Symbol[]) {
        this.reelsContainer.alpha = 1;
        this.lockedSymbolsContainer.alpha = 1;
        allSymbols.map(symbol => symbol.UnDimSymbol());
        // @ts-expect-error
        this.reelsContainer.parent.getChildByName("reelsAnimationOverlay").alpha = 0;
        this.currentAnimations.forEach(item => {
                item.parent.removeChild(item);
                item.highPrioritySymbol && (item.highPrioritySymbol.alpha = 1);
                item.baseSymbol && (item.baseSymbol.alpha = 1);
                item.destroy();
            }
        );
        this.currentAnimations = [];
    }
}

interface SymbolAnimation extends Symbol{
    baseSymbol?: Symbol;
    highPrioritySymbol?: Symbol;
}