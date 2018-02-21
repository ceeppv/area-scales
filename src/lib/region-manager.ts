import {postInvoke, preInvoke, Point, closerTo} from "./common";
import {Cut, Division, Region} from "./region";

const defaultAlpha = 0.5;

interface Constrained {
    constraint?: Constraint;
}

interface Constrainer {
    getConstraint(region: Region, weight: number): Constraint;
}

interface RegionData extends Division, Constrained {
    parent?: RegionData;
    oldAlpha?: number;
}

export interface RegionGeometry {
    points: Point[];
    cut: Cut;
    index: number;
}

class Constraint {
    from: number;
    to: number;
    minusFrom: number;
    minusTo: number;

    constructor(from: number, to: number, minusFrom: number, minusTo: number) {
        this.from = from;
        this.to = to;
        this.minusFrom = minusFrom;
        this.minusTo = minusTo;
    }

    constrain(newAlpha: number, oldAlpha: number): number {
        if(newAlpha === undefined) {
            return defaultAlpha * (this.to - this.from);
        }
        if(newAlpha >= 0) {
            return closerTo(newAlpha, this.from, this.to);
        }
        const constrained = -closerTo(Math.abs(newAlpha), this.minusFrom, this.minusTo);
        const limits = [this.minusFrom, this.minusTo];
        if(limits.indexOf(-oldAlpha) >= 0 && limits.indexOf(-constrained) >= 0) {
            return oldAlpha;
        }
        return constrained;
    }
}

class DefaultConstrainer implements Constrainer {
    getConstraint(region: Region, weight: number): Constraint {
        const fromVertex = 0;
        const toVertex = 1;
        const fromAlpha = region.vertices[fromVertex].alpha;
        const toAlpha = region.vertices[toVertex].alpha;
        const resultA = region.divide(fromAlpha, weight);
        const resultB = region.divide(toAlpha, weight);
        return new Constraint(
            fromAlpha,
            toAlpha,
            resultA.cut.region.toAlpha(resultA.cut.sb),
            resultB.cut.region.toAlpha(resultB.cut.sb)
        );
    }
}

export interface RegionManager {
    setFrame(arg: Point[]);
    setWeights(arg: number[]);
    updateAlphas(f: (alpha: number, index: number) => number);
    setAlpha(index: number, alpha: number);
    setConstrained(value: boolean);
    getGeometry(): RegionGeometry[];
}

export function makeRegionManager(points: Point[]): RegionManager {
    let frame: Region;
    let regionDataSet: RegionData[] = [];
    let needUpdate: boolean;
    let constrainer: Constrainer = new DefaultConstrainer();
    let isConstrained = false;

    setFrame(points);

    return {
        getGeometry: preInvoke(getGeometry, [ifNeedUpdate]),
        setAlpha: postInvoke(setAlpha, [setNeedUpdate]),
        setFrame: postInvoke(setFrame, [setNeedUpdate]),
        setWeights: postInvoke(setWeights, [setNeedUpdate]),
        setConstrained: postInvoke(setConstrained, [setNeedUpdate]),
        updateAlphas: postInvoke(updateAlphas, [setNeedUpdate]),
    };

    function setNeedUpdate() {
        needUpdate = true;
    }

    function setConstrained(value: boolean) {
        isConstrained = value;
    }

    function ifNeedUpdate() {
        if(needUpdate) {
            update();
            needUpdate = false;
        }
    }

    function setFrame(points: Point[]) {
        frame = new Region(points);
    }

    function getGeometry(): RegionGeometry[] {
        const geometry = regionDataSet.map((rd, index): RegionGeometry => ({
            points: rd.main.points,
            cut: rd.cut,
            index: index
        }));
        const lastIndex = regionDataSet.length - 1;
        if(lastIndex >= 0) {
            const rd = regionDataSet[lastIndex];
            geometry.push({
                points: rd.rest.points,
                cut: rd.cut,
                index: lastIndex
            });
        }
        return geometry;
    }

    function setAlpha(index: number, alpha: number) {
        regionDataSet[index].alpha = alpha;
    }

    function updateAlphas(f: (alpha: number, index: number) => number) {
        regionDataSet.forEach((rd, index) => {
            rd.alpha = f(rd.alpha, index);
        });
    }

    function normalized(arr: number[]): number[] {
        const brr = arr.filter(x => x > 0);
        for(let sum = 0, i = brr.length - 1; i >= 0; --i) {
            sum += brr[i];
            brr[i] /= sum;
        }
        brr.pop();
        return brr;
    }

    function setWeights(weights: number[]) {
        regionDataSet = normalized(weights).map((weight, i): RegionData =>
            Object.assign(regionDataSet[i] || {alpha: (i === 0 ? 0 : undefined)},{
                weight: weight,
            })
        );
    }

    function update() {
        regionDataSet.forEach((rd, i, rds) => {
            const region = i > 0 ? rds[i - 1].rest : frame;
            const c = constrainer.getConstraint(region, rd.weight);
            if(c && (isConstrained && i > 0) || rd.alpha === undefined) {
                rd.alpha = c.constrain(rd.alpha, rd.oldAlpha);
            }
            Object.assign(rd, region.divide(rd.alpha, rd.weight));
            rd.oldAlpha = rd.alpha;
        });
    }
}
