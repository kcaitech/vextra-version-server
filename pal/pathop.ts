import { IPalPath } from "@kcdesign/data";
import {StrokeOpts} from "@kcdesign/data/dist/basic/pal";

const PathKitInit = require('pathkit-wasm/bin/pathkit.js');

// - `PathKit.PathOp.DIFFERENCE`
// - `PathKit.PathOp.INTERSECT`
// - `PathKit.PathOp.REVERSE_DIFFERENCE`
// - `PathKit.PathOp.UNION`
// - `PathKit.PathOp.XOR`

// enum SkPathOp {
//     kDifference_SkPathOp,         //!< subtract the op path from the first path
//     kIntersect_SkPathOp,          //!< intersect the two paths
//     kUnion_SkPathOp,              //!< union (inclusive-or) the two paths
//     kXOR_SkPathOp,                //!< exclusive-or the two paths
//     kReverseDifference_SkPathOp,  //!< subtract the first path from the op path
// }

enum PathKitOp {
    DIFFERENCE,
    INTERSECT,
    UNION,
    XOR,
    REVERSE_DIFFERENCE,
}

interface PathKit {
    PathOp: {
        DIFFERENCE: PathKitOp.DIFFERENCE,
        INTERSECT: PathKitOp.INTERSECT,
        UNION: PathKitOp.UNION,
        XOR: PathKitOp.XOR,
        REVERSE_DIFFERENCE: PathKitOp.REVERSE_DIFFERENCE,
    };
    FromSVGString(str: string): PathKitPath;
}

interface PathKitPath {
    toSVGString(): string;
    op(path: PathKitPath, op: PathKitOp): boolean;
    delete(): void;
    addPath(otherPath: PathKitPath): PathKitPath;
}

const ServerPort = 10040 // 10040
let _ck: PathKit;
export async function init() {
    if (_ck) return;
    _ck = await PathKitInit({
        locateFile: (file: string) => `http://localhost:${ServerPort}/` + file
    })
}

export function difference(path0: string, path1: string): string {
    if (!_ck) throw Error("Not init");
    const p0: PathKitPath = _ck.FromSVGString(path0);
    const p1: PathKitPath = _ck.FromSVGString(path1);
    if (p0 && p1) {
        p0.op(p1, _ck.PathOp.XOR)
        const path = p0.toSVGString();
        p0.delete();
        p1.delete();
        return path;
    }
    console.log("difference op failed")
    return "";
}
export function intersection(path0: string, path1: string): string {
    if (!_ck) throw Error("Not init");
    const p0: PathKitPath = _ck.FromSVGString(path0);
    const p1: PathKitPath = _ck.FromSVGString(path1);
    if (p0 && p1) {
        p0.op(p1, _ck.PathOp.INTERSECT)
        const path = p0.toSVGString();
        p0.delete();
        p1.delete();
        return path;
    }
    console.log("intersect op failed")
    return "";
}
export function subtract(path0: string, path1: string): string {
    if (!_ck) throw Error("Not init");
    const p0: PathKitPath = _ck.FromSVGString(path0);
    const p1: PathKitPath = _ck.FromSVGString(path1);
    if (p0 && p1) {
        p0.op(p1, _ck.PathOp.DIFFERENCE)
        const path = p0.toSVGString();
        p0.delete();
        p1.delete();
        return path;
    }
    console.log("subtract op failed")
    return "";
}
export function union(path0: string, path1: string): string {
    if (!_ck) throw Error("Not init");
    const p0: PathKitPath = _ck.FromSVGString(path0);
    const p1: PathKitPath = _ck.FromSVGString(path1);
    if (p0 && p1) {
        p0.op(p1, _ck.PathOp.UNION)
        const path = p0.toSVGString();
        p0.delete();
        p1.delete();
        return path;
    }
    console.log("union op failed")
    return "";
}

export function stroke(ops?: StrokeOpts): string {
    return "";
}

export class PalPath implements IPalPath {
    private _path: PathKitPath;
    constructor(path: string) {
        if (!_ck) throw Error("Not init");
        this._path = _ck.FromSVGString(path);
    }
    // @ts-ignore
    difference(path: PalPath): boolean {
        return this._path.op((path)._path, _ck.PathOp.XOR);
    }
    // @ts-ignore
    intersection(path: PalPath): boolean {
        return this._path.op((path)._path, _ck.PathOp.INTERSECT);
    }
    // @ts-ignore
    subtract(path: PalPath): boolean {
        return this._path.op((path)._path, _ck.PathOp.DIFFERENCE);
    }
    // @ts-ignore
    union(path: PalPath): boolean {
        return this._path.op((path)._path, _ck.PathOp.UNION);
    }
    // @ts-ignore
    addPath(path: PalPath): boolean {
        this._path.addPath(path._path);
        return true;
    }
    toSVGString(): string {
        return this._path.toSVGString();
    }
    delete(): void {
        this._path.delete();
    }
    stroke(ops?: StrokeOpts): string {
        return this.toSVGString();
    }
}