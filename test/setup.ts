// jsdom in Node does not provide Path2D. Many rendering tests construct it.
if (typeof globalThis.Path2D === 'undefined') {
    class Path2DShim {
        public addPath(_path: Path2D, _transform?: DOMMatrix2DInit): void { }
        public arc(_x: number, _y: number, _radius: number, _startAngle: number, _endAngle: number, _counterclockwise?: boolean): void { }
        public arcTo(_x1: number, _y1: number, _x2: number, _y2: number, _radius: number): void { }
        public bezierCurveTo(_cp1x: number, _cp1y: number, _cp2x: number, _cp2y: number, _x: number, _y: number): void { }
        public closePath(): void { }
        public ellipse(_x: number, _y: number, _radiusX: number, _radiusY: number, _rotation: number, _startAngle: number, _endAngle: number, _counterclockwise?: boolean): void { }
        public lineTo(_x: number, _y: number): void { }
        public moveTo(_x: number, _y: number): void { }
        public quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number): void { }
        public rect(_x: number, _y: number, _w: number, _h: number): void { }
        public roundRect(_x: number, _y: number, _w: number, _h: number, _radii?: number | DOMPointInit | (number | DOMPointInit)[]): void { }
    }

    (globalThis as unknown as { Path2D: typeof Path2DShim }).Path2D = Path2DShim;
}
