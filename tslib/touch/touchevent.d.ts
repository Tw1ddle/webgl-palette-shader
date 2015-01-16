interface TouchEvent extends UIEvent {
    touches: TouchList;
    targetTouches: TouchList;
    changedTouches: TouchList;
    altKey: boolean;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    rotation: number;
    scale: number;

    // for iOS
    initTouchEvent(typeArg: string, canBubbleArg: boolean, cancelableArg: boolean, viewArg: Window, detailArg: number, screenXArg: number, screenYArg: number, clientXArg: number, clientYArg: number, ctrlKeyArg: boolean, altKeyArg: boolean, shiftKeyArg: boolean, metaKeyArg: boolean, touchesArg: TouchList, targetTouchesArg: TouchList, changedTouchesArg: TouchList, scale: number, rotation: number): void

    // for Android
    initTouchEvent(touchesArg: TouchList, targetTouchesArg: TouchList, changedTouchesArg: TouchList, typeArg: string, Aview: Window, screenXArg: number, screenYArg: number, clientXArg: number, clientYArg: number, ctrlKeyArg: boolean, altKeyArg: boolean, shiftKeyArg: boolean, metaKeyArg: boolean);
}

declare var TouchEvent: {
    prototype: TouchEvent;
    new (): TouchEvent;
}

interface TouchList {
    length: number;
    [index: number]: Touch;
    item: (index: number) => Touch;
}

interface Touch {
    identifier: number;
    target: EventTarget;
    screenX: number;
    screenY: number;
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
}

interface Window {
    ontouchstart: (ev: TouchEvent) => any;
    ontouchmove: (ev: TouchEvent) => any;
    ontouchend: (ev: TouchEvent) => any;
    ontouchcancel: (ev: TouchEvent) => any;
    addEventListener(type: "touchstart", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "touchmove", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "touchend", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "touchcancel", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
}

interface Document {
    ontouchstart: (ev: TouchEvent) => any;
    ontouchmove: (ev: TouchEvent) => any;
    ontouchend: (ev: TouchEvent) => any;
    ontouchcancel: (ev: TouchEvent) => any;
    addEventListener(type: "touchstart", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "touchmove", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "touchend", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "touchcancel", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
}

interface HTMLElement {
    ontouchstart: (ev: TouchEvent) => any;
    ontouchmove: (ev: TouchEvent) => any;
    ontouchend: (ev: TouchEvent) => any;
    ontouchcancel: (ev: TouchEvent) => any;
    addEventListener(type: "touchstart", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "touchmove", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "touchend", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "touchcancel", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
}

declare var ontouchstart: (ev: TouchEvent) => any;
declare var ontouchmove: (ev: TouchEvent) => any;
declare var ontouchend: (ev: TouchEvent) => any;
declare var ontouchcancel: (ev: TouchEvent) => any;

declare function addEventListener(type: "touchstart", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
declare function addEventListener(type: "touchmove", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
declare function addEventListener(type: "touchend", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;
declare function addEventListener(type: "touchcancel", listener: (ev: TouchEvent) => any, useCapture?: boolean): void;

