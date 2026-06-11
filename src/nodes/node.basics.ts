import type { INode } from "../interfaces";
import { NodeHandle, type IRect } from "../types";
import { isDiagramViewLike, isNode } from "../guards";
import type { INodeCached } from "../view/view.cache";

export class NodeBasics {

    static moveBy(node: INode, byX: number, byY: number, flags?: null | 'ignore_scale') {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        if (flags != 'ignore_scale' && coordinates) {
            byX = byX / coordinates.zoom;
            byY = byY / coordinates.zoom;
        }

        for (let pt of node.points) {
            pt.x += byX;
            pt.y += byY;
        }
    }

    static resizeBy(node: INode, byX: number, byY: number, preserveAspect?: boolean) {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        byX = byX / coordinates.zoom;
        byY = byY / coordinates.zoom;

        let rect = coordinates.getBoundingRect(node);
        rect.width = rect.width || 0.001;
        rect.height = rect.height || 0.001;

        // prevent reaching zero width or height..
        let minWidth = (node.owner.grid.forced) ? node.owner.grid.width : 8;
        if (rect.width + (byX) <= minWidth) {
            byX = 0;
        }
        let minHeight = (node.owner.grid.forced) ? node.owner.grid.height : 8;
        if (rect.height + (byY) <= minHeight) {
            byY = 0;
        }

        if (preserveAspect) {
            byY = byX * (rect.height / rect.width); // * Math.sign(byY);
        }
        // let wRatio = byX / rect.width;      //(rect.width + byX) / rect.width;
        // let hRatio = byY / rect.height;     //(rect.height + byY) / rect.height;
        for (let pt of node.points) {
            let wRatio = Math.abs(pt.x - rect.left) / rect.width;      //(rect.width + byX) / rect.width;
            let hRatio = Math.abs(pt.y - rect.top) / rect.height;     //(rect.height + byY) / rect.height;

            pt.x += byX * wRatio;
            pt.y += byY * hRatio;
        }
    }

    static resizeHandle(node: INode, handle: NodeHandle, byX: number, byY: number, preserveAspect?: boolean) {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();

        // To preserve ratio, we can rely on Shape resizing..
        let ratio = 1;

        if (preserveAspect) {
            let rect = coordinates.getBoundingRect(node);
            ratio = rect.width / rect.height;
            byY = (byX / ratio);
        }

        switch (handle) {
            case NodeHandle.NW: {  // Tested
                // if (preserveAspect) {
                //     let rect = shape.getRect();
                //     let ratio = rect.width / rect.height;
                //     byY = byX / ratio;
                // }
                this.resizeBy(node, -byX, -byY, preserveAspect);
                this.moveBy(node, byX, byY);
                break;
            }
            case NodeHandle.NE: {  // Tested
                // if (preserveAspect) {
                //     let rect = shape.getRect();
                //     let ratio = rect.width / rect.height;
                //     byY = -byX / ratio;
                // }

                // Here is the only place this matters !!!
                if (preserveAspect) byY = -byY;

                this.resizeBy(node, byX, -byY, preserveAspect);
                this.moveBy(node, 0, byY);
                break;
            }
            case NodeHandle.SW: {
                // if (preserveAspect) {
                //     let rect = shape.getRect();
                //     let ratio = rect.width / rect.height;
                //     byY = -byX / ratio;
                // }
                if (preserveAspect) byY = -byY;

                this.resizeBy(node, -byX, byY, preserveAspect);
                this.moveBy(node, byX, 0);
                break;
            }
            case NodeHandle.SE: {
                // if (preserveAspect) {   // Tested
                //     let rect = shape.getRect();
                //     let ratio = rect.width / rect.height;
                //     byY = byX / ratio;
                // }     
                this.resizeBy(node, byX, byY, preserveAspect);
                break;
            }
            case NodeHandle.N: {  // Tested
                if (preserveAspect) {
                    this.resizeBy(node, -byY * ratio, -byY, preserveAspect);
                } else {
                    this.resizeBy(node, 0, -byY, preserveAspect);
                }
                // shape.resizeBy(0, -byY, preserveAspect);
                this.moveBy(node, 0, byY);
                break;
            }
            case NodeHandle.S: {  // Tested
                if (preserveAspect) {
                    this.resizeBy(node, byY * ratio, byY, preserveAspect);
                } else {
                    this.resizeBy(node, 0, byY, preserveAspect);
                }
                // shape.moveBy(0, byY);
                break;
            }
            case NodeHandle.E: {
                this.resizeBy(node, byX, 0, preserveAspect);
                break;
            }
            case NodeHandle.W: {
                // if (preserveAspect) byY = -byY;

                this.resizeBy(node, -byX, 0, preserveAspect);
                this.moveBy(node, byX, 0);
                break;
            }
            // }

        }
    }

    static rotateTo(node: INode, degrees: number, kind: 'degrees' | 'radians' = 'degrees') {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const cache = diagram.getCache();
        let cached = cache.getNode(node) || {} as INodeCached;

        node.angle = (kind == 'degrees') ? degrees * Math.PI / 180 : degrees;
        // node.cos = Math.cos(node.angle);
        // node.sin = Math.sin(node.angle);
        cached.cos = Math.cos(node.angle);
        cached.sin = Math.sin(node.angle);
        cache.setNode(node, cached);
    }

    static overlaps(node: INode, target: IRect | INode): boolean {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return false;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (!target) return false;
        target = isNode(target) ? coordinates.getBoundingRect(target as INode, true) : target;
        let rect = coordinates.getBoundingRect(node, true);
        if (!rect) return false;

        if (rect.left > target.left + target.width) return false;
        if (rect.top > target.top + target.height) return false;
        if (target.left > rect.left + rect.width) return false;
        if (target.top > rect.top + rect.height) return false;


        if (!node.angle) return true;   // No further calculation required..

        // An alternative:
        // if (!this.angle && !this.hollow) return true;   // No further calculation required..

        // if (!this.angle && this.hollow) {
        //     let inpath: boolean;
        //     if (this.path) {
        //         inpath = (this.hollow)? 
        //                 this.owner.context.isPointInStroke(this.path, rect.left, rect.top) :
        //                 this.owner.context.isPointInPath(this.path, rect.left, rect.top);

        //         if (!inpath) inpath = (this.hollow)? 
        //                 this.owner.context.isPointInStroke(this.path, rect.left + rect.width, rect.top + rect.height) :
        //                 this.owner.context.isPointInPath(this.path, rect.left + rect.width, rect.top + rect.height);
        //     }
        //     if (inpath) return true;                
        // }

        if (node.angle) {

            for (let x = 0; x < target.width; x = Math.min(x + node.owner.grid.width, target.width)) {
                for (let y = 0; y < target.height; y = Math.min(y + node.owner.grid.height, target.height)) {

                    // let check = this.owner.getHitPoint({x: target.left + x, y: target.top + y}, rect, this.angle, this.cos, this.sin);
                    let check = { x: target.left + x, y: target.top + y };
                    // let tx = pt.x; y = pt.y;

                    for (let pt of node.points) {
                        if (Math.abs(pt.x - check.x) <= 4 && Math.abs(pt.y - check.y) <= 4)
                            return true;
                    }

                    let inpath: boolean = false;
                    if (cached.path && coordinates) {
                        // this.owner.context.lineWidth = 25;
                        inpath = (node.hollow) ?
                            coordinates.isPointInStroke(cached.path, x, y) :
                            coordinates.isPointInPath(cached.path, x, y);
                    }

                    // let inpath = (this.path && this.owner.context)? 
                    //         this.owner.context.isPointInPath(this.path, check.x, check.y) 
                    //         : false;
                    if (inpath) return true;
                }
            }
            return false;
        } else {
            return true;
        }
    }

    static inside(node: INode, target: IRect | INode): boolean {
        if (!target) return false;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return false;
        const coordinates = diagram.getCoordinates();

        target = isNode(target) ? coordinates.getBoundingRect(target as INode, true) : target;
        let rect = coordinates.getBoundingRect(node, true);
        if (!rect) return false;

        if (rect.left >= target.left && rect.top >= target.top) {
            if (rect.width <= target.width - (rect.left - target.left)) {
                if (rect.height <= target.height - (rect.top - target.top)) {
                    return true;
                }
            }
        }
        return false;
    }
}