import {KeyBindings} from "./controls";
import {round2} from "../lib/common";
import {App} from "./app";

const keyBindings: KeyBindings = {
    'KeyA' : {
        helpText: 'a: add slider',
        callback: (app: App) => {
            app.weights.push(app.weights[app.weights.length - 1]);
            app.regionManager.setWeights(app.weights);
            app.weightsInput['value'] = app.weights.join(' ');
        }
    },
    'KeyD' : {
        helpText: 'd: remove slider',
        callback: (app: App) => {
            if(app.weights.length > 1) {
                app.weights.pop();
                app.regionManager.setWeights(app.weights);
                app.weightsInput['value'] = app.weights.join(' ');
            }
        }
    },
    'KeyC' : {
        helpText: 'c: toggle un/constrained',
        callback: (app: any) => {
            app.constrain = !app.constrain;
            app.regionManager.setConstrained(app.constrain);
            app.updateView();
        }
    },
    'KeyS' : {
        helpText: 's: toggle 1x1/2x1',
        callback: (app: App) => {
            app.ratio = app.ratio === 1 ? 0.5 : 1;
            app.resize();
            app.updateFrame();
            app.regionManager.setFrame(app.frame);
            app.updateView();
        }
    },
    'KeyX' : {
        helpText: 'x: show/hide polygons areas',
        callback: (app: any) => {
            app.drawPolygons = !app.drawPolygons
        }
    },
    'KeyZ' : {
        helpText: 'z: show/hide slider knobs',
        callback: (app: App) => {
            app.drawPoints = !app.drawPoints;
            app.updateView();
            if (app.drawPoints) {
                app.drag(app.circlesU, false);
                app.drag(app.circlesV, true);
            }
        }
    },
    //     }
    '+' : {
        helpText: '+/-: add/remove vertices (3-32, 64, 128, 256)',
        callback: addVertex
    },
    '=' : {
        callback: addVertex
    },
    '-' : {
        callback: removeVertex
    },
    'Enter' : {
        helpText: 'Enter: export svg',
        callback: () => {
            // const markup = that.elementRef.nativeElement.getElementsByTagName('svg')[0].outerHTML;
            const markup = document.getElementsByTagName('svg')[0].outerHTML;
            // const markup = document.getElementsByClassName('contentContainer')[0].outerHTML;
            const blob = new Blob([
                '<?xml version="1.0" encoding="UTF-8"?>',
                markup
            ], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `polygon.${new Date().toISOString().replace(/[:]/g, '-')}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },
};


function addVertex(app: App) {
    app.frameVertexCount = Math.min(app.frameVertexCount + 1, 256);
    if (app.frameVertexCount > 32) {
        app.frameVertexCount = round2(app.frameVertexCount, true);
    }
    app.updateFrame();
    app.regionManager.setFrame(app.frame);
    app.updateView();
}

function removeVertex(app: App) {
    app.frameVertexCount = Math.max(app.frameVertexCount - 1, 3);
    if (app.frameVertexCount > 32) {
        app.frameVertexCount = round2(app.frameVertexCount, false);
    }
    app.updateFrame();
    app.regionManager.setFrame(app.frame);
    app.updateView();
}

export default keyBindings;
