import { IPalPath } from "@kcdesign/data";

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
enum Join {
    "MITER",
    "ROUND",
    "BEVEL"
}

enum Cap {
    "BUTT",
    "ROUND",
    "SQUARE",
}

interface PathKit {
    PathOp: {
        DIFFERENCE: PathKitOp.DIFFERENCE,
        INTERSECT: PathKitOp.INTERSECT,
        UNION: PathKitOp.UNION,
        XOR: PathKitOp.XOR,
        REVERSE_DIFFERENCE: PathKitOp.REVERSE_DIFFERENCE,
    }
    FromSVGString(str: string): PathKitPath
}

// enum class SkPathFillType {
//     /** Specifies that "inside" is computed by a non-zero sum of signed edge crossings */
//     kWinding,
//     /** Specifies that "inside" is computed by an odd number of edge crossings */
//     kEvenOdd,
//     /** Same as Winding, but draws outside of the path, rather than inside */
//     kInverseWinding,
//     /** Same as EvenOdd, but draws outside of the path, rather than inside */
//     kInverseEvenOdd
// };

// enum_<SkPathFillType>("FillType")
// .value("WINDING",            SkPathFillType::kWinding)
// .value("EVENODD",            SkPathFillType::kEvenOdd)
// .value("INVERSE_WINDING",    SkPathFillType::kInverseWinding)
// .value("INVERSE_EVENODD",    SkPathFillType::kInverseEvenOdd);

enum FillType {
    "WINDING",
    "EVENODD",
    "INVERSE_WINDING",
    "INVERSE_EVENODD"
}

interface StrokeOpts {
    // Default values are set in chaining.js which allows clients
    // to set any number of them. Otherwise, the binding code complains if
    // any are omitted.
    width?: number;
    miter_limit?: number;
    res_scale?: number;
    join?: Join;
    cap?: Cap;
}

interface PathKitPath {
    toSVGString(): string;
    op(path: PathKitPath, op: PathKitOp): boolean;
    delete(): void;
    addPath(otherPath: PathKitPath): PathKitPath;
    stroke(ops?: StrokeOpts): PathKitPath | null;
    setFillType(type: FillType): void;
    simplify(): PathKitPath | null;
}

//     // Stroke
// enum_<SkPaint::Join>("StrokeJoin")
//     .value("MITER", SkPaint::Join::kMiter_Join)
//     .value("ROUND", SkPaint::Join::kRound_Join)
//     .value("BEVEL", SkPaint::Join::kBevel_Join);

// enum_<SkPaint::Cap>("StrokeCap")
//     .value("BUTT",   SkPaint::Cap::kButt_Cap)
//     .value("ROUND",  SkPaint::Cap::kRound_Cap)
//     .value("SQUARE", SkPaint::Cap::kSquare_Cap);

// value_object<StrokeOpts>("StrokeOpts")
//     .field("width",       &StrokeOpts::width)
//     .field("miter_limit", &StrokeOpts::miter_limit)
//     .field("res_scale",   &StrokeOpts::res_scale)
//     .field("join",        &StrokeOpts::join)
//     .field("cap",         &StrokeOpts::cap);



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
    throw new Error("not implemented")
}
export function noneZero2evenOdd(path: string): string {
    if (!_ck) throw Error("Not init");
    const p0: PathKitPath = _ck.FromSVGString(path);
    p0.setFillType(FillType.WINDING);
    const p1 = p0.simplify(); // return this
    const ret = p1 ? p1.toSVGString() : "";
    p0.delete();
    return ret;
}

export class PalPath implements IPalPath {
    private _path: PathKitPath;
    constructor(path: string) {
        if (!_ck) throw Error("Not init");
        this._path = _ck.FromSVGString(path);
    }
    difference(path: PalPath): boolean {
        return this._path.op((path)._path, _ck.PathOp.XOR);
    }
    intersection(path: PalPath): boolean {
        return this._path.op((path)._path, _ck.PathOp.INTERSECT);
    }
    subtract(path: PalPath): boolean {
        return this._path.op((path)._path, _ck.PathOp.DIFFERENCE);
    }
    union(path: PalPath): boolean {
        return this._path.op((path)._path, _ck.PathOp.UNION);
    }
    stroke(ops?: StrokeOpts) {
        const path = this._path.stroke(ops); // return this
        const ret = path ? path.toSVGString() : "";
        return ret;
    }
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
}