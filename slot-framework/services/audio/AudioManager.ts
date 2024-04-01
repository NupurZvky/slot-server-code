import { Howl } from "howler";
import { Asset, AssetsMap, StageLoader } from "src/app/game/src/scenes/StageLoader";
import { GameEventsManager, IGameEvent } from "../events/eventsManager";
import { AudioEvents } from "../events/audioEvents";
import { gameConfigVariable } from "src/app/game/src/cfg/GameConfig/gameConfigVariable";

export class AudioManager {

    private currentlyPlayingBgSound: Howl;
    private currentlyPlayingSounds: {[key: string] : Howl}= {};
    private previousBgSound: Howl;
    private currentBgVolume: number = gameConfigVariable.BG_VOLUME;
    private internalAudioMap: Map<string, Asset<Howl>> = new Map();
    private isSFXPlaying: boolean;
    private currentSFX: any;
    private hasMuted: boolean = false;

    constructor(private stageLoader: StageLoader, private dispatcher: GameEventsManager) {
      // @ts-expect-error
      window.howl = Howler;
        Howler.volume(0.8);
        dispatcher.addListener(AudioEvents.PLAY_SOUND, this.playSound, this);
        dispatcher.addListener(AudioEvents.STOP_CURRENT_SOUND, this.stopCurrentSound, this);
        dispatcher.addListener(AudioEvents.SOUND_STOP, this.stopSound, this);
        dispatcher.addListener(AudioEvents.MUTE_AUDIO, this.muteAudio, this);
        dispatcher.addListener(AudioEvents.UNMUTE_AUDIO, this.unMuteAudio, this);
        dispatcher.addListener(AudioEvents.MUTE_AUDIO_CHECK, this.muteAudioCheck, this);
        dispatcher.addListener(AudioEvents.UNMUTE_AUDIO_CHECK, this.unMuteAudioCheck, this);
    }

    private play(sound: Asset<Howl>, isBgMusic: boolean = false, loop: boolean = false, onComplete?: Function) {
      if (isBgMusic) {
        this.previousBgSound = this.currentlyPlayingBgSound;
        this.currentlyPlayingBgSound = sound.data;
        this.previousBgSound && this.previousBgSound.stop();
        sound.data.loop(loop);
        sound.meta.options?.volume ? (this.currentBgVolume = sound.meta.options?.volume) : gameConfigVariable.BG_VOLUME;
        sound.data.volume(sound.meta.options?.volume || this.currentBgVolume);
        sound.data.play();
      } else {
        // if game sound
        this.isSFXPlaying = true;
        this.currentSFX = sound.data;
        if (sound.meta?.options?.bgVolume != null) {
          this.currentlyPlayingBgSound.volume(sound.meta.options.bgVolume);
        } else {
          this.currentlyPlayingBgSound.volume(this.currentBgVolume * 0.5);
        }
        sound.data.once("end", (data) => {
          !this.isSFXPlaying && this.currentlyPlayingBgSound.volume(this.currentBgVolume);
          if (this.currentSFX === sound.data) {
            this.isSFXPlaying = false;
          }
          onComplete && onComplete();
        });
        this.currentlyPlayingSounds[sound.meta.name] && this.currentlyPlayingSounds[sound.meta.name].stop() && (delete this.currentlyPlayingSounds[sound.meta.name]) ;
        this.currentlyPlayingSounds[sound.meta.name] = sound.data;
        sound.data.play();
        sound.data.loop(loop);
        sound.data.volume(sound.meta.options?.volume || 1);
      }
    }

    private stop(sound: Howl, isDimBg = false) {
      if(isDimBg) {
        this.currentlyPlayingBgSound.volume(this.currentBgVolume);
      }
      sound.stop();
    }

    private stopCurrentSound() {
      Object.keys(this.currentlyPlayingSounds).forEach(key => {
        this.currentlyPlayingSounds[key].stop();
        delete this.currentlyPlayingSounds[key];
      });
    }
    
    private playSound(event: IGameEvent) {
      const sound = this.getSoundFile(event.data.key);
      if (sound == null) {
        console.error(`CANNOT PLAY SOUND WITH KEY ${event.data.key}`);
      } else {
        this.play(sound, event.data.isBgMusic, event.data.loop, event.data.onComplete);
      }
    }

    private stopSound(event: IGameEvent) {
      const sound = this.getSoundFile(event.data.key);
      if (sound == null) {
        console.error(`CANNOT PLAY SOUND WITH KEY ${event.data.key}`);
      } else {
        this.stop(sound.data, event.data.isDimBg);
      }
    }

    private muteAudio() {
      Howler.volume(0);
      this.hasMuted = true;
    }

    private unMuteAudio() {
      Howler.volume(0.8);
      this.hasMuted = false;
    }
    private muteAudioCheck() {
      Howler.volume(0);
    }

    private unMuteAudioCheck() {
      if (this.hasMuted) {
        return;
      } else {
        Howler.volume(0.8);
      }
    }
    
    getSoundFile(key: string) {
        if (this.internalAudioMap.get(key) == null) {
            const audio: Asset<Howl> = this.getAudioFileFromLoadedAudio(key) as Asset<Howl>;
            if (audio) {
                this.internalAudioMap.set(key, audio as Asset<Howl>);
                return audio;
            } else {
                console.error(`CANNOT GET SOUND WITH KEY "${key}"`);
                return;
            }
        } else {
            return this.internalAudioMap.get(key);
        } 
    }

    getAudioFileFromLoadedAudio(name : string) {
        let audio: Asset | undefined;
        this.stageLoader.loadedAudio.forEach((v,group) => {
          const bundle = this.stageLoader.loadedAudio.get(group) as AssetsMap;
          if (bundle) {
            const audioData = bundle[name];
            if (audioData) {
              audio = audioData;
            }
          }
        });
        return audio;
      }
}
