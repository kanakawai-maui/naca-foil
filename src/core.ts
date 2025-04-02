
import { NacaCode } from './types';

export class NacaFoilMath {
        // NACA Symmetrical Airfoil Formula
        static foilY(x: number, c:number, t:number, closeAirfoils = true) {
            return (5 * t * c) * ((0.2969 * Math.sqrt(x / c)) - (0.1260 * (x / c)) -
                (0.3516 * Math.pow((x / c), 2)) + (0.2843 * Math.pow((x / c), 3)) -
                ((closeAirfoils ? 0.1036 : 0.1015) * Math.pow((x / c), 4)));
        }
    
        static camber(x: number, c: number, m: number, p: number) {
            return (x <= (p * c)) ?
                (((c * m) / Math.pow(p, 2)) * ((2 * p * (x / c)) - Math.pow((x / c), 2))) :
                (((c * m) / Math.pow((1 - p), 2)) * ((1 - (2 * p)) + (2 * p * (x / c)) - Math.pow((x / c), 2)));
        }
    
        static theta(x: number, c: number, m: number, p: number) {
            return (x <= (p * c)) ?
                Math.atan(((m) / Math.pow(p, 2)) * (p - (x / c))) :
                Math.atan(((m) / Math.pow((1 - p), 2)) * (p - (x / c)));
        }
    
        static camberY(x: number, c: number, t: number, m: number, p: number, upper = true) {
            return upper ?
                (NacaFoilMath.camber(x, c, m, p) + (NacaFoilMath.foilY(x, c, t) * Math.cos(NacaFoilMath.theta(x, c, m, p)))) :
                (NacaFoilMath.camber(x, c, m, p) - (NacaFoilMath.foilY(x, c, t) * Math.cos(NacaFoilMath.theta(x, c, m, p))));
        }
    
        static camberX(x: number, c: number, t: number, m: number, p: number, upper = true) {
            return upper ?
                (x - (NacaFoilMath.foilY(x, c, t) * Math.sin(NacaFoilMath.theta(x, c, m, p)))) :
                (x + (NacaFoilMath.foilY(x, c, t) * Math.sin(NacaFoilMath.theta(x, c, m, p))));
        }
}

export class NacaFoil {
    points: [number, number][] = [];



    // Generate airfoil points
    _constructor(c: number = 100, naca_code: NacaCode = '0015', resolution: number = 100, fill=true) {
        let naca = parseInt(naca_code);
        let t = (naca % 100) / 100;
        let m = Math.floor((naca - (naca % 100)) / 1000) / 100;
        let p = (((naca - (naca % 100)) / 100) % 10) / 10;
        let res = c / resolution;
        
        let shift = 10;

        // Upper surface
        for (let i = 0; i <= c; i += res) {
            this.points.push([NacaFoilMath.camberX(i+shift, c, t, m, p), NacaFoilMath.camberY(i, c, t, m, p)]);
        }
        
        // Lower surface
        for (let i = c; i >= 0; i -= res) {
            this.points.push([NacaFoilMath.camberX(i+shift, c, t, m, p, false), NacaFoilMath.camberY(i, c, t, m, p, false)]);
        }

        // Ensure leading edge connection
        for(let i=0; i<c; i+=res) {
            if(!fill && i > 0) {
                break;
            }
            let leadingEdgeXUpper = NacaFoilMath.camberX(shift + i, c, t, m, p);
            let leadingEdgeYUpper = NacaFoilMath.camberY(0 + i, c, t, m, p);
            let leadingEdgeXLower = NacaFoilMath.camberX(shift + i, c, t, m, p, false);
            let leadingEdgeYLower = NacaFoilMath.camberY(0 + i, c, t, m, p, false);

            // Add both upper and lower leading edge points
            this.points.push([leadingEdgeXUpper, leadingEdgeYUpper]);
            this.points.push([leadingEdgeXLower, leadingEdgeYLower]);
        }
    }

    getPoints() {
        return this.points;
    }
}