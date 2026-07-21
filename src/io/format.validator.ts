import type { ArrowType, IPoint, ITextAlign, ITextBaseline, ITextOrientation } from "../types";
import type { FillStyle, StrokeStyle, TextStyle } from "../style.interfaces";
import type { ISerializedDiagram, ISerializedNode } from "./serialized.types";
import type { IGradient } from "../color.types";
import { ObjectCheck, type CheckOptions } from "@samatawy/checks";
import type { SpecSheet } from "../sheets/spec.sheet";

const MISSING = 'missing';
const MISTYPED = 'mistyped';
const INVALID = 'invalid';

export class FormatValidator {

    private static missing(field: string): CheckOptions {
        return {
            code: MISSING,
            err: `Missing required field: ${field}`,
        };
    }

    private static mistyped(field: string, expectedType: string): CheckOptions {
        return {
            code: MISTYPED,
            err: `Field ${field} is mistyped, expected type: ${expectedType}`,
        };
    }

    private static invalid(reason: string): CheckOptions {
        return {
            code: INVALID,
            err: reason,
        };
    }

    private static checkTextStyle = (ts: ObjectCheck) => {
        console.debug('Checking text style', (ts as any).data?.weight, (ts as any).data);
        return [
            ts.optional('fontFace').string(),
            ts.optional('size').number().atLeast(0),
            ts.optional('color').string(),
            ts.optional('halo').string(),
            ts.optional('align').string().equalsOneOf(['left', 'center', 'right']),
            ts.optional('baseline').string().equalsOneOf(['top', 'middle', 'bottom']),
            ts.optional('orientation').string().equalsOneOf(['horizontal', 'vertical', 'path']),
            ts.optional('weight').number().atLeast(100).atMost(900)
                .isTrue((w) => w % 100 === 0, this.invalid('Weight must be a multiple of 100')),
            ts.optional('italic').boolean(),
            ts.optional('underline').boolean(),
        ]
    }

    private static checkStrokeStyle = (ss: ObjectCheck) => {
        return [
            ss.optional('color').string(),
            ss.optional('width').number().atLeast(1),
            ss.optional('dash').array().of('number'),
            // ss.optional('dash').array().isTrueEach((d) => typeof d === 'number', this.mistyped('Dash array', 'array of numbers')),
            ss.optional('arrow_start').string()
                .equalsOneOf(['none', 'solid_triangle', 'hollow_triangle', 'solid_spear', 'hollow_spear', 'solid_diamond', 'hollow_diamond', 'solid_circle', 'hollow_circle']),
            ss.optional('arrow_end').string()
                .equalsOneOf(['none', 'solid_triangle', 'hollow_triangle', 'solid_spear', 'hollow_spear', 'solid_diamond', 'hollow_diamond', 'solid_circle', 'hollow_circle']),
        ];
    }

    private static checkFillStyle = (fs: ObjectCheck) => {
        return [
            fs.optional('color').string(),
            fs.optional('gradient').object().check((g) => [
                g.optional('type').string().equalsOneOf(['linear', 'radial', 'conic']),
                g.optional('angle').number(),
                g.optional('centerX').number(),
                g.optional('centerY').number(),
                g.optional('stops').array().checkEach((stop) => [
                    stop.required('id').string(),
                    stop.required('color').string(),
                    stop.required('position').number().atLeast(0).atMost(100),
                ]),
            ]),
        ];
    }

    private static checkShadowStyle = (ss: ObjectCheck) => {
        return [
            ss.optional('color').string(),
            ss.optional('offsetX').number(),
            ss.optional('offsetY').number(),
            ss.optional('blur').number().atLeast(0),
        ];
    }

    public static async isValidDiagram(json: ISerializedDiagram): Promise<ObjectCheck> {
        const check = await ObjectCheck.for(json).check((d) => [
            d.required('id', this.missing('id')).string(),
            d.required('nodes', this.missing('nodes')).array().checkEach((node) => [
                node.required('id', this.invalid('Every node must have an id')).string(),
                node.required('type', this.invalid('Every node must have a type')).string(),

                node.optional('angle').number(),
                node.optional('opacity').number().atLeast(0).atMost(1),
                node.optional('hollow').boolean(),
                node.optional('locked').boolean(),
                node.optional('locked_aspect').boolean(),
                node.optional('invisible').boolean(),
                node.optional('textStyle').object().check(this.checkTextStyle),
                node.optional('strokeStyle').object().check(this.checkStrokeStyle),
                node.optional('fillStyle').object().check(this.checkFillStyle),
                node.optional('shadowStyle').object().check(this.checkShadowStyle),

                node.optional('points').array().checkEach((point) => [
                    point.required('x').number(),
                    point.required('y').number(),
                ]),
                node.optional('geometry').object(),
                node.optional('specific').object(),
                node.optional('meta').object(),
            ]),
            d.optional('groups').array().checkEach((group) => [
                group.required('id').string(),
                group.required('nodes').array().of('string'),
                // .isTrueEach((nodeId) => typeof nodeId === 'string', this.invalid('A group must have an array of node ids as strings')),
            ]),
            d.optional('layers').array().checkEach((layer) => [
                layer.required('id', { code: MISSING }).string(),
                layer.required('name', { code: MISSING }).string(),
                layer.required('visible', { code: MISSING }).boolean(),
                layer.required('nodes', { code: MISSING }).array().of('string'),
                // .isTrueEach((nodeId) => typeof nodeId === 'string', this.invalid('A layer must have an array of nodes ids as strings')),
            ]),
            d.optional('sheet_id').string(),
            d.optional('background').object().check(this.checkFillStyle),
            d.optional('meta').object(),
            d.optional('image_assets').object(),
        ]);
        return check;
    }

    public static async isValidSpecSheet(sheet: SpecSheet): Promise<ObjectCheck> {
        const check = await ObjectCheck.for(sheet).check((s) => [
            s.required('id', this.missing('id')).string(),
            s.required('name', this.missing('name')).string(),
            s.optional('version').string(),
            s.optional('description').string(),
            s.required('diagram', this.missing('diagram')).object().check((d) => [
                d.optional('background').object().check(this.checkFillStyle),
            ]),
            s.required('types', this.missing('types')).object(),
            s.required('classes', this.missing('classes')).object()
                .values((v) => [
                    v.object().check((style) => [
                        style.required('textStyle').object().check(this.checkTextStyle),
                        style.required('strokeStyle').object().check(this.checkStrokeStyle),
                        style.required('fillStyle').object().check(this.checkFillStyle),
                        style.required('shadowStyle').object().check(this.checkShadowStyle),
                    ]),
                ])
        ]);
        //     ([className, style]) => [
        //     style.required('textStyle', this.missing(`textStyle for class ${className}`))
        //         .object().check(this.checkTextStyle),
        //     style.required('strokeStyle', this.missing(`strokeStyle for class ${className}`))
        //         .object().check(this.checkStrokeStyle),
        //     style.required('fillStyle', this.missing(`fillStyle for class ${className}`))
        //         .object().check(this.checkFillStyle),
        //     style.required('shadowStyle', this.missing(`shadowStyle for class ${className}`))
        //         .object().check(this.checkShadowStyle),
        // ]).reduce((acc, val) => acc.concat(val), []))
        // )]);
        return check;
    }


    // public static isValidDiagram(json: ISerializedDiagram): FormatValidationResult {

    //     if (!json || typeof json !== 'object') return INVALID_FORMAT_RESULT;
    //     if (!Array.isArray(json.nodes)) return INVALID_FORMAT_RESULT;
    //     for (const node of json.nodes) {
    //         const result = this.isValidNode(node);
    //         if (!result.is_valid) return result;
    //     }

    //     if (json.id && typeof json.id !== 'string') return INVALID_FORMAT_RESULT;
    //     if (json.groups && !Array.isArray(json.groups)) return INVALID_FORMAT_RESULT;
    //     if (json.layers && !Array.isArray(json.layers)) return INVALID_FORMAT_RESULT;

    //     if (json.sheet_id && typeof json.sheet_id !== 'string') return INVALID_FORMAT_RESULT;
    //     if (json.sheet && typeof json.sheet !== 'object') return INVALID_FORMAT_RESULT;

    //     if (json.background && !this.isValidFillStyle(json.background)) return INVALID_FORMAT_RESULT;
    //     if (json.meta && typeof json.meta !== 'object') return INVALID_FORMAT_RESULT;
    //     if (json.image_assets && typeof json.image_assets !== 'object') return INVALID_FORMAT_RESULT;

    //     return VALID_FORMAT_RESULT;
    // }

    // public static isValidNode(json: ISerializedNode): FormatValidationResult {
    //     if (!json || typeof json !== 'object') return INVALID_FORMAT_RESULT;
    //     if (typeof json.id !== 'string') return INVALID_FORMAT_RESULT;
    //     if (typeof json.type !== 'string') return INVALID_FORMAT_RESULT;

    //     if (json.angle && typeof json.angle !== 'number') return INVALID_FORMAT_RESULT;
    //     if (json.opacity && typeof json.opacity !== 'number') return INVALID_FORMAT_RESULT;

    //     if (json.hollow && typeof json.hollow !== 'boolean') return INVALID_FORMAT_RESULT;
    //     if (json.locked && typeof json.locked !== 'boolean') return INVALID_FORMAT_RESULT;
    //     if (json.locked_aspect && typeof json.locked_aspect !== 'boolean') return INVALID_FORMAT_RESULT;
    //     if (json.invisible && typeof json.invisible !== 'boolean') return INVALID_FORMAT_RESULT;

    //     if (json.textStyle && !this.isValidTextStyle(json.textStyle)) return INVALID_FORMAT_RESULT;
    //     if (json.strokeStyle && !this.isValidStrokeStyle(json.strokeStyle)) return INVALID_FORMAT_RESULT;
    //     if (json.fillStyle && !this.isValidFillStyle(json.fillStyle)) return INVALID_FORMAT_RESULT;

    //     if (json.points && !this.isValidPointArray(json.points)) return INVALID_FORMAT_RESULT;

    //     if (json.geometry && typeof json.geometry !== 'object') return INVALID_FORMAT_RESULT;
    //     if (json.specific && typeof json.specific !== 'object') return INVALID_FORMAT_RESULT;
    //     if (json.meta && typeof json.meta !== 'object') return INVALID_FORMAT_RESULT;

    //     return VALID_FORMAT_RESULT;
    // }

    // public static isValidStylesheet(json: any): FormatValidationResult {
    //     // Implement your validation logic here
    //     return VALID_FORMAT_RESULT;
    // }

    // public static isValidTextStyle(json: TextStyle): FormatValidationResult {

    //     if (!json || typeof json !== 'object') return INVALID_FORMAT_RESULT;
    //     if (json.fontFace && typeof json.fontFace !== 'string') return INVALID_FORMAT_RESULT;
    //     if (json.size && !this.isValidSize(json.size)) return INVALID_FORMAT_RESULT;
    //     if (json.color && typeof json.color !== 'string') return INVALID_FORMAT_RESULT;
    //     if (json.halo && typeof json.halo !== 'string') return INVALID_FORMAT_RESULT;
    //     if (json.align && !this.isValidTextAlign(json.align)) return INVALID_FORMAT_RESULT;
    //     if (json.baseline && !this.isValidTextBaseline(json.baseline)) return INVALID_FORMAT_RESULT;
    //     if (json.orientation && !this.isValidTextOrientation(json.orientation)) return INVALID_FORMAT_RESULT;
    //     if (json.weight && !this.isValidFontWeight(json.weight)) return INVALID_FORMAT_RESULT;
    //     if (json.italic && typeof json.italic !== 'boolean') return INVALID_FORMAT_RESULT;
    //     if (json.underline && typeof json.underline !== 'boolean') return INVALID_FORMAT_RESULT;

    //     return VALID_FORMAT_RESULT;
    // }

    // public static isValidPoint(json: IPoint): FormatValidationResult {
    //     if (!json || typeof json !== 'object') return INVALID_FORMAT_RESULT;
    //     if (typeof json.x !== 'number') return INVALID_FORMAT_RESULT;
    //     if (typeof json.y !== 'number') return INVALID_FORMAT_RESULT;

    //     return VALID_FORMAT_RESULT;
    // }

    // public static isValidPointArray(json: IPoint[]): FormatValidationResult {
    //     if (!Array.isArray(json)) return INVALID_FORMAT_RESULT;
    //     for (const point of json) {
    //         const result = this.isValidPoint(point);
    //         if (!result.is_valid) return INVALID_FORMAT_RESULT;
    //     }
    //     return VALID_FORMAT_RESULT;
    // }

    // public static isValidStrokeStyle(json: StrokeStyle): FormatValidationResult {

    //     if (!json || typeof json !== 'object') return INVALID_FORMAT_RESULT;
    //     if (json.color && typeof json.color !== 'string') return INVALID_FORMAT_RESULT;
    //     if (json.width && !this.isValidSize(json.width)) return INVALID_FORMAT_RESULT;
    //     if (json.dash && !this.isValidDashArray(json.dash)) return INVALID_FORMAT_RESULT;
    //     if (json.arrow_start && !this.isValidArrowType(json.arrow_start)) return INVALID_FORMAT_RESULT;
    //     if (json.arrow_end && !this.isValidArrowType(json.arrow_end)) return INVALID_FORMAT_RESULT;

    //     return VALID_FORMAT_RESULT;
    // }

    // public static isValidFillStyle(json: FillStyle): FormatValidationResult {

    //     if (!json || typeof json !== 'object') return INVALID_FORMAT_RESULT;
    //     if (json.color && typeof json.color !== 'string') return INVALID_FORMAT_RESULT;
    //     if (json.gradient && !this.isValidGradient(json.gradient)) return INVALID_FORMAT_RESULT;

    //     return VALID_FORMAT_RESULT;
    // }

    // private static isValidGradient(json: IGradient): boolean {
    //     if (!json || typeof json !== 'object') return false;
    //     if (json.type && typeof json.type !== 'string') return false;
    //     if (json.stops && !Array.isArray(json.stops)) return false;
    //     return true;
    // }

    // private static isValidTextAlign(value: any): boolean {
    //     const validAligns: ITextAlign[] = ['left', 'center', 'right'];
    //     return validAligns.includes(value);
    // }

    // private static isValidTextBaseline(value: any): boolean {
    //     const validBaselines: ITextBaseline[] = ['top', 'middle', 'bottom'];
    //     return validBaselines.includes(value);
    // }

    // private static isValidTextOrientation(value: any): boolean {
    //     const validOrientations: ITextOrientation[] = ['horizontal', 'vertical', 'path'];
    //     return validOrientations.includes(value);
    // }

    // private static isValidFontWeight(value: any): boolean {
    //     return typeof value === 'number' && value >= 100 && value <= 900 && value % 100 === 0;
    // }

    // private static isValidSize(value: any): boolean {
    //     return typeof value === 'number' && value > 0;
    // }

    // private static isValidDashArray(value: any): boolean {
    //     if (!Array.isArray(value)) return false;
    //     return value.every(num => typeof num === 'number' && num >= 0);
    // }

    // private static isValidArrowType(value: any): boolean {
    //     const validArrowTypes: ArrowType[] = ['none', 'solid_triangle', 'hollow_triangle', 'solid_spear', 'hollow_spear', 'solid_diamond', 'hollow_diamond', 'solid_circle', 'hollow_circle'];
    //     return validArrowTypes.includes(value);
    // }
}