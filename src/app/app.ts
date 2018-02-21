import * as d3selection from "d3-selection";
import * as d3drag from "d3-drag";
import {log, rotateArray} from "../lib/common";
import {View} from "./view";
import keyBindings from "./key-bindings";
import {Controls} from "./controls";
import {SegmentPoint} from "../lib/region";
import {makeRegionManager, RegionGeometry, RegionManager} from "../lib/region-manager";

export class App {
    view: View;
    regionManager: RegionManager;

    constrain = false;

    drawPoints = true;
    drawPolygons = false;

    weights: number[];

    circlesU;
    circlesUb;
    circlesV;

    ratio = 0.5;
    frameWidth;
    frameHeight;
    frameVertexCount = 4;

    frame;

    timerHandle: number;
    alphaIncrement: number;

    weightsInput;
    weightPresets = '2 12 8 4';
    alphaPresets = '0.11 0.087 0.115';

    constructor(private parentSelector: string) {
        this.setup();
        this.resize();

        this.updateFrame();
        this.regionManager = makeRegionManager(this.frame);
        this.regionManager.setWeights(this.weights);
        const alphas = this.stringToNumbers(this.alphaPresets);
        this.regionManager.updateAlphas((alpha, index) => alphas[index]);
        this.updateView();

        this.updateView();
    }

    inputVisible(value: boolean) {
        const inputWrapper = document.getElementById('input-wrapper');
        if (value) {
            inputWrapper.classList.remove('hidden');
        } else {
            inputWrapper.classList.add('hidden');
        }
    }

    updateView() {
        [this.circlesU, this.circlesUb, this.circlesV] = this.view.render(this.regionManager.getGeometry(), {
            drawPolygons: this.drawPolygons,
            drawPoints: this.drawPoints,
            frame: this.frame
        });
        this.drag(this.circlesU, false);
        this.drag(this.circlesUb, false);
        this.drag(this.circlesV, true);
    }
    addLegendItem(s: string) {
        const legend = document.getElementById('legend');
        const p = document.createElement('p');
        p.appendChild(document.createTextNode(s));
        legend.appendChild(p);
    }
    setWeights(weights: number[]) {
        this.regionManager.setWeights(weights);
    }
    setup() {
        this.view = new View(this.parentSelector);

        document.getElementById('weights').addEventListener('change', (event) => {
            this.weights = this.stringToNumbers(event.target['value'].replace(/[^0-9.]+/g, ' ')).filter(x => x > 0);
            if(this.weights.length === 0) {
                this.weights.push(1);
            }
            this.weightsInput['value'] = this.weights.join(' ');
            this.regionManager.setWeights(this.weights);
            this.updateView();
        });

        const controls = new Controls(this, keyBindings);

        controls.helpTexts.forEach((line) => {
            line && this.addLegendItem(line);
        });

        d3selection.select(window)
            .on('resize', () => {
                this.resize();
                this.updateView();
            });

        d3selection.select('body')
            .on('keydown', () => {
                if (d3selection.event.target.classList.contains('ignore') && d3selection.event.code !== 'Escape') {
                    return;
                }
                const e = d3selection.event;
                const x = e.which || e.keyCode;
                if(x !== 13) {
                    controls.processKey(d3selection.event);
                }
                this.updateView();
            })
            .on('keyup', () => {
                if (d3selection.event.target.classList.contains('ignore') && d3selection.event.code !== 'Escape') {
                    return;
                }
                const e = d3selection.event;
                const x = e.which || e.keyCode;
                if(x === 13) {
                    controls.processKey(d3selection.event);
                }
            });

        this.weightsInput = document.getElementById('weights');
        this.weightsInput['value'] = this.weightPresets;
        this.weights = this.stringToNumbers(this.weightsInput['value']);
    }

    stringToNumbers(s: string) {
        return s.split(/\s+/).filter(t => t.length > 0).map(x => parseFloat(x));
    }

    drag(circles: any, secondEnd: boolean) {
        const dragHandler = d3drag.drag()
            .on('drag', (d: RegionGeometry, i: number) => {
                const cursor = { x: d3selection.event.x, y:  d3selection.event.y };
                let projected: SegmentPoint;
                if(!this.constrain || i === 0 || secondEnd) {
                    projected = d.cut.region.radialProject(cursor);
                } else {
                    projected = d.cut.region.project(cursor);
                }
                let alpha = d.cut.region.toAlpha(projected);
                secondEnd && (alpha = -alpha);
                this.regionManager.setAlpha(d.index, alpha);
                this.updateView();
            });
        dragHandler(circles);
    }

    resize() {
        const input = document.getElementById('weights');
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.frameWidth = 0.40 * Math.min(width, height);
        this.frameHeight = this.frameWidth * this.ratio;

        input.style.width = `${this.frameWidth}px`;

        this.view.resize(width, height, this.frameWidth, this.frameHeight);
    }

    updateFrame() {
        this.frame = [];
        const n = this.frameVertexCount;
        const offsetAngle = Math.PI * (0.5 + 1 / n);
        for (let i = 0; i < n; ++i) {
            const angle = 2 * Math.PI * i / n + offsetAngle;
            this.frame.push({
                x: (0.5 + Math.cos(angle)) * this.frameWidth,
                y: (0.5 + Math.sin(angle)) * this.frameHeight
            });
        }
        rotateArray(this.frame, -2);
        this.frame.reverse();
    }
}
