import {
	BufferGeometry,
	Float32BufferAttribute,
    Vector3
} from 'three';
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';

class Vector3Ext extends Vector3 {
    point: Vector3;
    getComponent: (j: 0 | 1 | 2) => number;
}

/**
 * This class can be used to generate a convex hull for a given array of 3D points.
 * The average time complexity for this task is considered to be O(nlog(n)).
 *
 * ```js
 * const geometry = new ConvexGeometry( points );
 * const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
 * const mesh = new THREE.Mesh( geometry, material );
 * scene.add( mesh );
 * ```
 *
 * @augments BufferGeometry
 */
class ConvexGeometry extends BufferGeometry {

	/**
	 * Constructs a new convex geometry.
	 *
	 * @param {Array<Vector3>} points - An array of points in 3D space which should be enclosed by the convex hull.
	 */
	constructor( points: Array<Vector3> ) {

		super();

		// buffers

		const vertices = [];
		const normals = [];
        
		const lps = points.map((point) => {
			const newPoint = Object.assign(new Vector3(point.x, point.y, point.z), {
				point: point,
				getComponent: (j: 0 | 1 | 2) => {
					if (j === 1) return point.y;
					if (j === 2) return point.z;
					return point.x;
				}
			});
			return newPoint;
		});
		const convexHull = new ConvexHull().setFromPoints(lps);

		// generate vertices and normals

		const faces = convexHull.faces;

		for ( let i = 0; i < faces.length; i ++ ) {

			const face = faces[ i ];
			let edge = face.edge;

			// we move along a doubly-connected edge list to access all face points (see HalfEdge docs)

			do {

				const point = edge.head().point;

				vertices.push( point.x, point.y, point.z );
				normals.push( face.normal.x, face.normal.y, face.normal.z );

				edge = edge.next;

			} while ( edge !== face.edge );

		}

		// build geometry

		this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
		this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );

	}

}

export { ConvexGeometry };