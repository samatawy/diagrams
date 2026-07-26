import type { ISerializedDiagram } from "./serialized.types";
import { FieldCheck, ObjectCheck, type CheckOptions } from "@samatawy/checks";
import type { StyleSheet } from "../sheets/style.sheet";

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
            ss.optional('dash').anyOf([
                (f) => [f.string().equalsOneOf(['solid', 'dashed', 'dotted', 'dashdot', 'dash_dot', 'dash-dot'])],
                (f) => [f.array().of('number')],
            ]),
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
            ]),
            d.optional('layers').array().checkEach((layer) => [
                layer.required('id', { code: MISSING }).string(),
                layer.required('name', { code: MISSING }).string(),
                layer.required('visible', { code: MISSING }).boolean(),
                layer.required('nodes', { code: MISSING }).array().of('string'),
            ]),
            d.optional('sheet_id').string(),
            d.optional('background').object().check(this.checkFillStyle),
            d.optional('meta').object(),
            d.optional('image_assets').object(),
        ]);
        return check;
    }

    public static async isValidStyleSheet(sheet: StyleSheet): Promise<ObjectCheck> {
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
        return check;
    }

}