import * as THREE from 'three';

// NACA Symmetrical Airfoil Formula
function foilY(x, c, t, closeAirfoils = true) {
    return (5 * t * c) * ((0.2969 * Math.sqrt(x / c)) - (0.1260 * (x / c)) -
        (0.3516 * Math.pow((x / c), 2)) + (0.2843 * Math.pow((x / c), 3)) -
        ((closeAirfoils ? 0.1036 : 0.1015) * Math.pow((x / c), 4)));
}

function camber(x, c, m, p) {
    return (x <= (p * c)) ?
        (((c * m) / Math.pow(p, 2)) * ((2 * p * (x / c)) - Math.pow((x / c), 2))) :
        (((c * m) / Math.pow((1 - p), 2)) * ((1 - (2 * p)) + (2 * p * (x / c)) - Math.pow((x / c), 2)));
}

function theta(x, c, m, p) {
    return (x <= (p * c)) ?
        Math.atan(((m) / Math.pow(p, 2)) * (p - (x / c))) :
        Math.atan(((m) / Math.pow((1 - p), 2)) * (p - (x / c)));
}

function camberY(x, c, t, m, p, upper = true) {
    return upper ?
        (camber(x, c, m, p) + (foilY(x, c, t) * Math.cos(theta(x, c, m, p)))) :
        (camber(x, c, m, p) - (foilY(x, c, t) * Math.cos(theta(x, c, m, p))));
}

function camberX(x, c, t, m, p, upper = true) {
    return upper ?
        (x - (foilY(x, c, t) * Math.sin(theta(x, c, m, p)))) :
        (x + (foilY(x, c, t) * Math.sin(theta(x, c, m, p))));
}

// Generate airfoil points
function generateAirfoil(c = 100, naca_code = '0015', resolution = 100) {
    let naca = parseInt(naca_code);
    let t = (naca % 100) / 100;
    let m = Math.floor((naca - (naca % 100)) / 1000) / 100;
    let p = (((naca - (naca % 100)) / 100) % 10) / 10;
    let res = c / resolution;

    let points = [];

    // Upper surface
    for (let i = 0; i <= c; i += res) {
        points.push(new THREE.Vector2(camberX(i, c, t, m, p), camberY(i, c, t, m, p)));
    }
    // Ensure leading edge connection
    let leadingEdgeX = camberX(0, c, t, m, p);
    let leadingEdgeY = (camberY(0, c, t, m, p) + camberY(0, c, t, m, p, false)) / 2;
    points.push(new THREE.Vector2(leadingEdgeX, leadingEdgeY));
    
    // Lower surface
    for (let i = c; i >= 0; i -= res) {
        points.push(new THREE.Vector2(camberX(i, c, t, m, p, false), camberY(i, c, t, m, p, false)));
    }
    points.push(points[0]); // Close the shape

    return points;

    return points;
}

export { generateAirfoil };