let reversed = false;
function setupCurveTable(plane) {
    plane.svg.addEventListener("mouseup", _ => {
        // let n = Date.now();
         reversed = false;
        let curvePoints = createBezierPoints(plane.controlPoints, 2 ** 17);
        let curve = createEqualSpacePoints(curvePoints);
        // console.log(Date.now() - n + "ms");
        testTone(curve);
        createText(plane);
        gE("info").textContent = reversed?"reversed":Date.now();
    });
}

function cubicBezier(t, p0, p1, p2, p3) { let ost = 1 - t; return ost * ost * ost * p0 + 3 * ost * ost * t * p1 + 3 * ost * t * t * p2 + t * t * t * p3; }
function createBezierPoints(p, numSamples = 40) {
    let curvePoints = [];
    for (let i = 0, a = ((numSamples - 1) / 2); i < numSamples; i++) {
        let t = i / a - 1;
        let x = sign(t) * cubicBezier(abs(t), p[0].x, p[1].x, p[2].x, p[3].x);
        let y = sign(t) * cubicBezier(abs(t), p[0].y, p[1].y, p[2].y, p[3].y);
        curvePoints.push({ x, y });
    }
    return curvePoints;
}// TODO: 左右対称なら計算を半分にできる

function createEqualSpacePoints(cp, numSamples = gE("outputSampleRate").value) {
    let output = new Float32Array(numSamples);
    for (let i = 0, a = ((numSamples - 1) / 2), cpIndex = 1; i < numSamples; i++) {
        let x = i / a - 1;
        while (x > cp[cpIndex].x) {
            cpIndex++;
            if (cp[cpIndex - 1].x > cp[cpIndex].x) reversed = true;
        }
        let cp2 = cp[cpIndex], cp1 = cp[cpIndex - 1];
        let d = (x - cp1.x) / (cp2.x - cp1.x);
        output[i] = cp1.y * (1 - d) + cp2.y * d;
    }
    
    return output;
}

function createText(plane) {
    let cpText = "[";
    plane.controlPoints.forEach(p => cpText += `{x:${p.x}, y:${p.y}}, `);
    cpText = cpText.slice(0, cpText.length - 2) + "]";
    let numSamples = gE("outputSampleRate").value;

    let code = codeContainer
        .toString()
        .match(/^function codeContainer\(\) \{([\s\S]+)}$/m)[1]
        .replace("$0", cpText)
        .replace("$1", numSamples);

    gE("outputTextArea").value = code;
}

function codeContainer() {
const curve = (function () {
    const p = $0, ns = $1;
    function cubicBezier(t, p0, p1, p2, p3) {
        let ost = 1 - t;
        return ost * ost * ost * p0 + 3 * ost * ost * t * p1 + 3 * ost * t * t * p2 + t * t * t * p3;
    }
    function createBezierPoints(p, numSamples = 2 ** 17) {
        let curvePoints = [];
        for (let i = 0, a = ((numSamples - 1) / 2); i < numSamples; i++) {
            let t = i / a - 1;
            let x = Math.sign(t) * cubicBezier(Math.abs(t), p[0].x, p[1].x, p[2].x, p[3].x);
            let y = Math.sign(t) * cubicBezier(Math.abs(t), p[0].y, p[1].y, p[2].y, p[3].y);
            curvePoints.push({ x, y });
        }
        return curvePoints;
    }
    function createEqualSpacePoints(cp, numSamples) {
        let output = new Float32Array(numSamples);
        for (let i = 0, a = ((numSamples - 1) / 2), cpIndex = 1; i < numSamples; i++) {
            let x = i / a - 1;
            while (x > cp[cpIndex].x) cpIndex++;
            let cp2 = cp[cpIndex], cp1 = cp[cpIndex - 1];
            let d = (x - cp1.x) / (cp2.x - cp1.x);
            output[i] = cp1.y * (1 - d) + cp2.y * d;
        }
        return output;
    }
    let curvePoints = createBezierPoints(p);
    return createEqualSpacePoints(curvePoints,ns);
    })();
}
