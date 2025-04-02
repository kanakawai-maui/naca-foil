import * as THREE from 'three';
import { NacaCode } from './types';

// NACA Symmetrical Airfoil Formula
function foilY(x: number, c:number, t:number, closeAirfoils = true) {
    return (5 * t * c) * ((0.2969 * Math.sqrt(x / c)) - (0.1260 * (x / c)) -
        (0.3516 * Math.pow((x / c), 2)) + (0.2843 * Math.pow((x / c), 3)) -
        ((closeAirfoils ? 0.1036 : 0.1015) * Math.pow((x / c), 4)));
}

function camber(x: number, c: number, m: number, p: number) {
    return (x <= (p * c)) ?
        (((c * m) / Math.pow(p, 2)) * ((2 * p * (x / c)) - Math.pow((x / c), 2))) :
        (((c * m) / Math.pow((1 - p), 2)) * ((1 - (2 * p)) + (2 * p * (x / c)) - Math.pow((x / c), 2)));
}

function theta(x: number, c: number, m: number, p: number) {
    return (x <= (p * c)) ?
        Math.atan(((m) / Math.pow(p, 2)) * (p - (x / c))) :
        Math.atan(((m) / Math.pow((1 - p), 2)) * (p - (x / c)));
}

function camberY(x: number, c: number, t: number, m: number, p: number, upper = true) {
    return upper ?
        (camber(x, c, m, p) + (foilY(x, c, t) * Math.cos(theta(x, c, m, p)))) :
        (camber(x, c, m, p) - (foilY(x, c, t) * Math.cos(theta(x, c, m, p))));
}

function camberX(x: number, c: number, t: number, m: number, p: number, upper = true) {
    return upper ?
        (x - (foilY(x, c, t) * Math.sin(theta(x, c, m, p)))) :
        (x + (foilY(x, c, t) * Math.sin(theta(x, c, m, p))));
}

// Generate airfoil points
function generateAirfoil(c: number = 100, naca_code: NacaCode = '0015', resolution: number = 100, fill=true) {
    let naca = parseInt(naca_code);
    let t = (naca % 100) / 100;
    let m = Math.floor((naca - (naca % 100)) / 1000) / 100;
    let p = (((naca - (naca % 100)) / 100) % 10) / 10;
    let res = c / resolution;

    let points = [];
    let shift = 10;

    // Upper surface
    for (let i = 0; i <= c; i += res) {
        points.push(new THREE.Vector2(camberX(i+shift, c, t, m, p), camberY(i, c, t, m, p)));
    }
    
    // Lower surface
    for (let i = c; i >= 0; i -= res) {
        points.push(new THREE.Vector2(camberX(i+shift, c, t, m, p, false), camberY(i, c, t, m, p, false)));
    }

    // Ensure leading edge connection
    for(let i=0; i<c; i+=res) {
        if(!fill && i > 0) {
            break;
        }
        let leadingEdgeXUpper = camberX(shift + i, c, t, m, p);
        let leadingEdgeYUpper = camberY(0 + i, c, t, m, p);
        let leadingEdgeXLower = camberX(shift + i, c, t, m, p, false);
        let leadingEdgeYLower = camberY(0 + i, c, t, m, p, false);

        // Add both upper and lower leading edge points
        points.push(new THREE.Vector2(leadingEdgeXUpper, leadingEdgeYUpper));
        points.push(new THREE.Vector2(leadingEdgeXLower, leadingEdgeYLower));
    }
    return points;
}

export { generateAirfoil };