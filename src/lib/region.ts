import {
    area, clamp, distance, interpolate, rotateArray, isInner, sub, getCentroid, dot, normalized, len, Point, placement,
    log,
} from "./common";

interface Vertex {
    alpha: number;
    point: Point;
}

export interface Division {
    cut?: Cut;
    main?: Region;
    rest?: Region;
    weight?: number;
    alpha?: number;
}

export interface SegmentPoint {
    beta: number;
    first: number;
    second: number;
}

export interface Cut {
    a: Point;
    b: Point;
    region: Region;
    sa: SegmentPoint;
    sb: SegmentPoint;
}

class CutImpl implements Cut {
    public get a(): Point {
        return this.region.toPoint(this.sa);
    }
    public get b(): Point {
        return this.region.toPoint(this.sb);
    }
    public region: Region;
    public sa: SegmentPoint;
    public sb: SegmentPoint;
}

export class Region {
    private _vertices: Vertex[] = [];
    private _points: Point[] = [];
    private centroid: Point;

    get vertices(): Vertex[] {
        return this._vertices;
    }

    public get points(): Point[] {
        return this._points;
    }

    constructor(points: Point[]) {
        if (points.length === 0) return;
        this._points = points;
        let accumLength = 0;
        let lengths = [];
        let prev;
        points.forEach((current) => {
            accumLength += distance(prev || current, current);
            lengths.push(accumLength);
            prev = current;
        });
        accumLength += distance(points[0], points[points.length - 1]);
        lengths.push(accumLength);
        lengths.forEach((l, i) => {
            this._vertices.push({
                point: points[i % points.length],
                alpha: l / accumLength
            });
        });
        this.centroid = getCentroid(this.points);
    }

    public divide(alpha: number, weight: number): Division {
        const [cutA, cutB] = this.makeCut(alpha, weight);
        const cutPointA = this.toPoint(cutA);
        const cutPointB = this.toPoint(cutB);

        let cutPoints = [];
        cutB.beta > 0 && cutPoints.push(cutPointB);
        cutA.beta < 1 && cutPoints.push(cutPointA);
        let mainPoints = [...cutPoints, ...this.pointsBetween(cutA.second, cutB.first)];
        // cutB.beta === 0 && rotateArray(mainPoints, 1);

        cutPoints = [];
        cutA.beta > 0 && cutPoints.push(cutPointA);
        cutB.beta < 1 && cutPoints.push(cutPointB);
        let restPoints = [...cutPoints, ...this.pointsBetween(cutB.second, cutA.first)];
        cutA.beta === 0 && rotateArray(restPoints, 1);

        const cut = new CutImpl();
        Object.assign(cut, {
            region: this,
            sa: cutA,
            sb: cutB,
        });

        return {
            cut: cut,
            main: new Region(mainPoints),
            rest: new Region(restPoints),
            alpha: alpha,
            weight: weight
        };
    }

    public toPoint(sp: SegmentPoint): Point {
        return interpolate(this._vertices[sp.first].point, this._vertices[sp.second].point, sp.beta);
    }

    public toAlpha(sp: SegmentPoint): number {
        const vs = this._vertices;
        const uA = vs[sp.first].alpha;
        const uB = vs[(sp.first + 1) % vs.length].alpha;
        return uA + sp.beta * (uB - uA);
    }

    public segmentPointAt(alpha: number): SegmentPoint {
        alpha = clamp(alpha, 0, 1);
        let i = 0;
        const vs = this._vertices;
        const len = vs.length;
        while (i < len - 1 && alpha >= vs[i].alpha) {
            ++i;
        }
        const uA = vs[i - 1].alpha;
        const uB = vs[i].alpha;
        return {
            first: (i - 1) % len,
            second: i % len,
            beta: (alpha - uA) / (uB - uA)
        };
    }

    public radialProject(p: Point): SegmentPoint {
        for (let j = 0; j < this.points.length; ++j) {
            const c = this.centroid;
            const a = this.points[j];
            const b = this.points[(j + 1) % this.points.length];
            const areaCAB = area(c, a, b);
            const areaCAP = area(c, a, p);
            const areaCPB = area(c, p, b);
            if (isInner(areaCAB, areaCAP, areaCPB)) {
                return {
                    first: j,
                    second: (j + 1) % this.points.length,
                    beta: areaCAP / (areaCAP + areaCPB)
                };
            }
        }
    }

    public project(p: Point): SegmentPoint {
        const a = this.points[0];
        const b = this.points[1];
        const ba = sub(a, b);
        const bp = sub(p, b);
        const cosPhi = dot(normalized(ba), normalized(bp));
        return {
            beta: (1 - clamp(cosPhi * len(bp) / len(ba), 0, 1)),
            first: 0,
            second: 1
        };
    }

    private makeCut(alpha: number, weight: number): [SegmentPoint, SegmentPoint] {
        let a = alpha;
        if (alpha < 0) {
            a = -alpha;
            weight = 1 - weight;
        }
        let cutPointA = this.segmentPointAt(a);
        const accumArea = this.getAccumArea(this.toPoint(cutPointA), cutPointA.second);
        const needed = weight;
        let i = 0;
        const len = this._vertices.length;

        while (needed > accumArea[i % len]) ++i;
        const area1 = accumArea[(i - 1 + len) % len];
        const area2 = accumArea[(i + len) % len];
        // i = placement(accumArea, needed);
        // const area1 = accumArea[i - 1];
        // const area2 = i + 1 < len ? accumArea[i] : 1;

        const diff = needed - area1;
        const c = diff / (area2 - area1);
        const j = i + cutPointA.second;
        let cutPointB = {
            first: (j - 1 + len) % len,
            second: j % len,
            beta: c
        };
        return alpha >= 0 ? [cutPointA, cutPointB] : [cutPointB, cutPointA];
    }

    private pointsBetween(indexA: number, indexB: number): Point[] {
        const ps = [];
        const len = this._vertices.length;
        for (let i = indexA % len; i != (indexB + 1) % len; i = (i + 1) % len) {
            ps.push(this._vertices[i].point);
        }
        return ps;
    }

    private getAccumArea(rootPoint: Point, offset: number): number[] {
        let sum = 0;
        const len = this._vertices.length;
        const accumArea = [0];
        for (let i = 1; i < len; ++i) {
            const j = (offset + i - 1) % len;
            const k = (offset + i) % len;
            sum += Math.abs(area(rootPoint, this._vertices[j].point, this._vertices[k].point));
            accumArea.push(sum);
        }
        return accumArea.map((x) => x / sum);
    }
}
