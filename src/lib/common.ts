import {polygonArea, polygonCentroid} from "d3-polygon";
import {Cut} from "./region";

export interface Point {
    readonly x: number;
    readonly y: number;
}

export type AnyFunc = (...any) => any;

export function area(a: Point, b: Point, c: Point): number {
    return polygonArea([a, b, c].map((p: Point): [number, number] => [p.x, p.y]));
}

export function log(...x) {
    window.console.log(...x);
}

export function interpolate(p, q: Point, alpha: number): Point {
    return add(p, mul(sub(q, p), alpha));
}

export function dot(p, q: Point): number {
    return p.x * q.x + p.y * q.y;
}

export function distance(p: Point, q: Point): number {
    return len(sub(p, q));
}

export function len(p: Point): number {
    return Math.sqrt(p.x * p.x + p.y * p.y);
}

export function len2(p: Point): number {
    return p.x * p.x + p.y * p.y;
}

export function normalized(p: Point): Point {
    const l = len(p);
    if (l === 0) {
        return { x: 0, y:  0 };
    }
    const m = 1.0 / l;
    return { x: p.x * m, y:  p.y * m };
}

export function sub(p, q: Point): Point {
    return { x: p.x - q.x, y:  p.y - q.y };
}

export function add(p, q: Point): Point {
    return { x: p.x + q.x, y:  p.y + q.y };
}

export function mul(p: Point, c: number): Point {
    return { x: p.x * c, y:  p.y * c };
}

export function eq(p, q: Point): boolean {
    return p.x === q.x && p.y === q.y;
}

export function clamp(x, a, b): number {
    return Math.max(a, Math.min(b, x));
}

export function round2(x: number, up: boolean): number {
    const a = up ? 1 : 0;
    return Math.pow(2, a + Math.floor(Math.log2(x)));
}

export function project(p: Point, s: Cut): Point {
    const ba = sub(s.a, s.b);
    const bc = sub(p, s.b);
    const cosPhi = dot(normalized(ba), normalized(bc));
    const d = cosPhi * len(bc);
    const e = normalized(ba);
    return {
        x: s.b.x + e.x * d,
        y: s.b.y + e.y * d
    };
}

export function constrain(c: Point, s: Cut): Point {
    const ca = sub(s.a, c);
    const cb = sub(s.b, c);
    const d = dot(ca, cb);
    if (d <= 0) {
        return c;
    } else if (len2(ca) < len2(cb)) {
        return s.a;
    } else {
        return s.b;
    }
}

export function isInner(t0: number, t1: number, t2: number): boolean {
    return t0 <= 0 && t1 <= 0 && t2 <= 0 && (t1 < 0 || t2 < 0)
        || t0 >= 0 && t1 >= 0 && t2 >= 0 && (t1 > 0 || t2 > 0);
}

export function getCentroid(points: Point[]): Point {
    const coords = polygonCentroid(points.map((p: Point): [number, number] => [p.x, p.y]));
    return { x: coords[0], y: coords[1] };
}

export function rotateArray(arr: any[], count: number): void {
    const len = arr.length;
    count = (count % len + len) % len;
    arr.unshift(...arr.splice(arr.length - count, count));
}

export function closerTo(x: number, a: number, b: number, s: number = 1): number {
    if(x >= a && x <= b) return x;
    const d = (s - b + a) * 0.5;
    if(x > b) return x - b > d ? a : b;
    return a - x < d ? a : b;
}

export function placement(arr: number[], x: number): number {
    let l = 0, r = arr.length;
    let m = (l + r) >>> 1;
    while(l < r) {
        if(x > arr[m])
            l = m + 1;
        else
            r = m;
        m = (l + r) >>> 1;
    }
    return l;
}

export function makePathString(points: Point[]) {
    return points.map((p: Point) => { return `${p.x},${p.y}`; }).join(' ');
}

export function postInvoke(f: AnyFunc, gs: AnyFunc[]): any {
    return chainInvoke(f, gs, false);
}

export function preInvoke(f: AnyFunc, gs: AnyFunc[]): any {
    return chainInvoke(f, gs, true);
}

export function chainInvoke(f: AnyFunc, gs: AnyFunc[], pre: boolean): AnyFunc {
    return function (...args) {
        let result;
        const main = () => { result = f(...args); };
        const secondary = () => {
            const self = this;
            gs.forEach((g) => { g.bind(self)(); });
        };
        if(pre) {
            secondary();
            main();
        } else {
            main();
            secondary();
        }
        return result;
    }
}
