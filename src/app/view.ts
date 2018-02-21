import {Selection} from "d3-selection";
import * as d3shape from "d3-shape";
import * as d3selection from "d3-selection";
import {makePathString} from "../lib/common";
import {RegionGeometry} from "../lib/region-manager";

type SelectionRD = Selection<any, RegionGeometry, any, void>;
type SelectionAny = Selection<any, any, any, void>;

const POINT_SIZE = 6;

const colorSet1 = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'];
const color = (i) => {
    return i === 0 ? '#fff' : colorSet1[(i - 1) % colorSet1.length];
};

export class View {
    private svg: SelectionAny;
    private bg: SelectionAny;
    private container: SelectionAny;
    private areasContainer: SelectionRD;
    private frameContainer: SelectionRD;
    private linesContainer: SelectionRD;
    private circlesContainer: SelectionRD;

    constructor(private parentSelector: string) {
        this.svg = d3selection.select(parentSelector).append('svg')
            .attr('class', 'svg-element')
            .attr('version', 1.1)
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
        ;

        this.bg = this.svg.append('rect')
            .attr('width', `${window.innerWidth}`)
            .attr('height', `${window.innerHeight}`)
        ;

        this.container = this.svg.append('g')
            .attr('class','contentContainer')
        ;

        this.frameContainer = this.makeContainer('frameContainer');
        this.areasContainer = this.makeContainer('areasContainer');
        this.linesContainer = this.makeContainer('linesContainer');
        this.circlesContainer = this.makeContainer('circlesContainer');
    }

    private makeContainer(className: string): SelectionRD {
        return this.container.append('g').attr('class', className);
    }

    resize(width: number, height: number, frameWidth: number, frameHeight: number) {
        this.svg
            .attr('width', `${width}`)
            .attr('height', `${height}`)
        ;
        this.bg
            .attr('width', `${width}`)
            .attr('height', `${height}`)
        ;
        this.container.attr(
            'transform',
            `translate(${(width - frameWidth) * 0.5},${(height - frameHeight) * 0.48})`
        );
    }

    render(rg: RegionGeometry[], options: any): [SelectionRD, SelectionRD, SelectionRD] {
        this.renderFrame(options.drawPolygons ? '' : makePathString(options.frame));
        this.renderPolygons(options.drawPolygons ? rg : []);
        rg = rg.slice(0, rg.length - 1);
        this.renderLines(options.drawPolygons ? [] : rg);
        const circleData = options.drawPoints ? rg : [];
        const circlesU = this.renderCircles(
            'knob-a',
            1,
            (d: RegionGeometry, i) => color(i),
            (d: RegionGeometry) => d.cut.a.x,
            (d: RegionGeometry) => d.cut.a.y,
            circleData
        );
        const circlesUb = this.renderCircles(
            'knob-c',
            0.3,
            'black',
            (d: RegionGeometry) => d.cut.a.x,
            (d: RegionGeometry) => d.cut.a.y,
            circleData
        );
        const circlesV = this.renderCircles(
            'knob-b',
            1,
            (d: RegionGeometry, i) => color(i),
            (d: RegionGeometry) => d.cut.b.x,
            (d: RegionGeometry) => d.cut.b.y,
            circleData
        );
        return [circlesU, circlesUb, circlesV];
    }

    renderCircles(className: string,
                  pointScale: number,
                  fill: any,
                  getX: (d: RegionGeometry) => number,
                  getY: (d: RegionGeometry) => number,
                  data: RegionGeometry[]): any {
        const t = this.circlesContainer
            .selectAll(`.${className}`)
            .data(data)
        ;
        t.exit().remove();
        return t.enter()
            .append('circle')
            .attr('class', className)
            .attr('fill', fill)
            .attr('stroke', '#282828')
            .attr('stroke-width', '0.25')
            .merge(t)
            .attr('r', POINT_SIZE * pointScale)
            .attr('cx', getX)
            .attr('cy', getY)
            ;
    }

    renderPolygons(data: RegionGeometry[]) {
        const areas = this.areasContainer
            .selectAll('.area')
            .data(data);
        areas.exit().remove();
        areas.enter()
            .append('polygon')
            .attr('fill', (d: RegionGeometry, i) => color(i))
            .attr('class', 'area')
            .merge(areas)
            .attr('stroke', (d: RegionGeometry, i) => color(i))
            .attr('points', (d: RegionGeometry) => makePathString(d.points))
        ;
    }

    renderFrame(pathString: string) {
        const b = this.frameContainer.selectAll('.bounds').data([pathString]);
        b.exit().remove();
        b.enter()
            .append('polygon')
            .attr('fill', 'none')
            .attr('class', 'bounds')
            .merge(b)
            .attr('stroke-width', '1.33')
            .attr('stroke', '#222')
            .attr('points', pathString)
        ;
    }

    renderLines(data: RegionGeometry[]) {
        const segments = this.linesContainer.selectAll('.segment').data(data);
        segments.exit().remove();
        segments.enter()
            .append('path')
            .attr('stroke', (d: RegionGeometry, i) => color(i))
            .attr('class', 'segment')
            .merge(segments)
            .attr('stroke-width', '1.25')
            .attr('d', (d: RegionGeometry) => d3shape.line()([
                [d.cut.a.x, d.cut.a.y], [d.cut.b.x, d.cut.b.y]
            ]))
        ;
    }
}
