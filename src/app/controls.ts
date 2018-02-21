import {App} from "./app";

type KeyBindingCallback = (app: App, event?: KeyboardEvent) => void;

type KeyBinding = {
    callback: KeyBindingCallback,
    helpText?: string,
};

export type KeyBindings = { [_: string]: KeyBinding };

export class Controls {
    public helpTexts: string[];

    constructor(private app: any,
                private keyBindings: KeyBindings) {
        this.helpTexts = Object.keys(this.keyBindings)
            .map(k => this.keyBindings[k])
            .map(kb => kb.helpText)
        ;
    }

    processKey(event: KeyboardEvent) {
        if(this.keyBindings[event.key] && this.keyBindings[event.code] && event.key !== event.code) {
            console.warn(`Duplicate key/code bindings: ["${event.key}", "${event.code}"].`);
        }
        const kb = this.keyBindings[event.key] || this.keyBindings[event.code];
        kb && kb.callback && kb.callback(this.app, event);
    }
}
