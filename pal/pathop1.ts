import { Path2D } from "skia-canvas";
import { IPalPath, StrokeOpts } from "@kcdesign/data";

export async function init() {
}

export function difference(path0: string, path1: string): string {
    const p0: Path2D = new Path2D(path0);
    const p1: Path2D = new Path2D(path1);
    const result = p0.xor(p1);
    // console.log("difference", result);
    return result.d;
}
export function intersection(path0: string, path1: string): string {
    const p0: Path2D = new Path2D(path0);
    const p1: Path2D = new Path2D(path1);
    const result = p0.intersect(p1);
    // console.log("intersect", result);
    return result.d;
}
export function subtract(path0: string, path1: string): string {
    const p0: Path2D = new Path2D(path0);
    const p1: Path2D = new Path2D(path1);
    // p0.contains()
    const result = p0.difference(p1);
    // console.log("difference", result);
    return result.d;
}
export function union(path0: string, path1: string): string {
    const p0: Path2D = new Path2D(path0);
    const p1: Path2D = new Path2D(path1);
    const result = p0.union(p1);
    // console.log("union", result);
    return result.d;
}
export function stroke(ops?: StrokeOpts): string {
    throw new Error("not implemented")
}

export class PalPath implements IPalPath {
    private _path: Path2D;
    constructor(path: string) {
        this._path = new Path2D(path);
    }
    difference(path: PalPath): boolean {
        this._path = this._path.xor(path._path);
        return true;
    }
    intersection(path: PalPath): boolean {
        this._path = this._path.intersect(path._path);
        return true;
    }
    subtract(path: PalPath): boolean {
        this._path = this._path.difference(path._path);
        return true;
    }
    union(path: PalPath): boolean {
        this._path = this._path.union(path._path);
        return true;
    }
    stroke(ops?: StrokeOpts): string {
        // throw new Error("not implemented")
        return this.toSVGString();
    }
    addPath(path: PalPath): boolean {
        this._path.addPath(path._path);
        return true;
    }
    toSVGString(): string {
        return this._path.d;
    }
    delete(): void {
    }
}