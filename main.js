const gE = id => { return document.getElementById(id) };
window.addEventListener("error", e => gE("info").textContent = e.message);
Object.getOwnPropertyNames(Math).forEach(p => self[p] = Math[p]);
Number.prototype.round = function (digit = 1) { digit = pow(10, digit); return round(this * digit) / digit; };

class CoordinatePlane {
    constructor(width = 256, height = width, zoom = 0.6, dragCallback = x => x) {
        this.dragCallback = dragCallback;
        this.width = width;
        this.height = height;
        this.zoom = zoom;
        this.centerX = width / 2;
        this.centerY = height / 2;
        this.cooSize = min(this.height, this.width);
        this.cooHalf = this.cooSize / 2;
        this.draggingEl = null;
        this.points = [];
        this.pointsCount = 0;
        this.svgEl = this.createSVG();
    }
    get svg() { return this.svgEl; }
    addPoint(x = 0, y = 0, r = 0.01, moveCallback) {
        let p = new this.Point(this, x, y, r, moveCallback);
        this.points.push(p);
        return p;
    }
    removePoint(id) {
        this.svgEl.removeChild(this.points[id].element);
        this.points[id] = null;
    }
    createSVG() {
        const t = this;
        let svgEl = this.svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgEl.setAttribute("width", this.width);
        svgEl.setAttribute("height", this.height);
        svgEl.addEventListener("mousemove", e => {
            if (!this.draggingEl) return;
            let dx = e.x - this.draggingEl.x;
            let dy = e.y - this.draggingEl.y;
            this.dragCallback(this.points[this.draggingEl.element.dataset.pointId], dx, dy);
            this.draggingEl.x += dx;
            this.draggingEl.y += dy;
        })
        svgEl.addEventListener("mouseup", e => { this.draggingEl = null; });
        this.line(0, this.centerY + this.toY(+1), this.width, this.centerY + this.toY(+1), "grey");
        this.line(0, this.centerY + this.toY(-1), this.width, this.centerY + this.toY(-1), "grey");

        this.line(this.centerX + this.toX(+1), 0, this.centerX + this.toX(+1), this.height, "grey");
        this.line(this.centerX + this.toX(-1), 0, this.centerX + this.toX(-1), this.height, "grey");

        this.line(this.centerX + this.toX(-1), this.centerY + this.toY(-1), this.centerX + this.toX(+1), this.centerY + this.toY(+1), "grey");

        this.line(this.centerX, 0, this.centerX, this.height);
        this.line(0, this.centerY, this.width, this.centerY);
        return svgEl;
    }
    line(x1, y1, x2, y2, color = "black") {
        let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        let attrs = { x1, y1, x2, y2 };
        for (let key in attrs) line.setAttribute(key, attrs[key]);
        line.style.stroke = color;
        this.svgEl.appendChild(line);
    }

    toX(x = 0) { return + this.cooHalf * x * this.zoom }
    toY(y = 0) { return - this.cooHalf * y * this.zoom }
    cooX(x = 0) { return +x / (this.cooHalf * this.zoom) }
    cooY(y = 0) { return -y / (this.cooHalf * this.zoom) }

    circle(cx = 0, cy = 0, r = 0.02, pointId = 0, plane, stroke = "black", fill = "white", strokeWidth = 0.005) {
        let elem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        elem.dataset.pointId = pointId;
        cx = plane.centerX + plane.toX(cx);
        cy = plane.centerY + plane.toY(cy);
        r = plane.cooSize * r;
        strokeWidth = plane.cooSize * strokeWidth;

        let attrs = { cx, cy, r, stroke, fill, "stroke-width": strokeWidth };
        for (let key in attrs) elem.setAttribute(key, attrs[key]);
        elem.addEventListener("mousedown", e => { plane.draggingEl = { element: e.target, x: e.x, y: e.y } });
        this.svgEl.appendChild(elem);
        return elem;
    }
}

CoordinatePlane.prototype.Point = class Point {
    constructor(plane, x = 0.5, y = -1, r, moveCallback = x => x) {
        this.plane = plane;
        this.moveCallback = moveCallback;
        this.id = plane.pointsCount++;
        this.x = x;
        this.y = y;
        this.r = r;
        this.element = plane.circle(x, y, r, this.id, plane);
    }
    moveTo(x, y) {
        this.x = x;
        this.y = y;
        this._move();
    }
    moveBy(dx, dy) {
        this.x += this.plane.cooX(dx);
        this.y += this.plane.cooY(dy);
        this._move();
    }
    _move() {
        this.moveCallback(this);
        let p = this.plane;
        this.element.setAttribute("cx", p.centerX + p.toX(this.x));
        this.element.setAttribute("cy", p.centerY + p.toY(this.y));
    }
}

function dragHandler(point, dx, dy) {
    if (point.id > 3) return;
    point.moveBy(dx, dy);
    let curvePoints = createBezierPoints(this.controlPoints);

    for (let i = 0, l = curvePoints.length; i < l; i++) {
        let p = curvePoints[i];
        this.curvePoints[i].moveTo(p.x, p.y);
    }
    
}

window.addEventListener("load", _ => {
    let plane = new CoordinatePlane(320, 320, 0.4, dragHandler);
    let cp = plane.controlPoints = [];

    function rounder(p) {
        p.x = p.x.round(5);
        p.y = p.y.round(5);
    }
    cp.push(
        plane.addPoint(0, 0, 0.02, p => { p.x = 0; rounder(p) }),
        plane.addPoint(0.2, 0.6, 0.02, p => { p.x = max(0, p.x); rounder(p) }),
        plane.addPoint(0.6, 0.9, 0.02, rounder),
        plane.addPoint(1, 1, 0.02, p => { p.x = max(1, p.x); rounder(p) }),
    );

    let curvePoints = createBezierPoints(plane.controlPoints);

    plane.curvePoints = [];
    for (let i = 0, l = curvePoints.length; i < l; i++) {
        let p = curvePoints[i];
        plane.curvePoints.push(plane.addPoint(p.x, p.y, 0.001));
    }
    cp.forEach(p => plane.svg.appendChild(p.element)); // z index

    gE("container").appendChild(plane.svg);
    setupCurveTable(plane);
});

