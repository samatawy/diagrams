import { DiagramEditor } from '../../dist/index.js';
import { registerAdapters } from '../demo-common.js';

registerAdapters();

const host = document.getElementById('diagram-editor-host');
if (!host) throw new Error('Host element not found');

const editor = new DiagramEditor(host);

const view = editor.getDiagramView();
view.loadDiagram({
    "id": "diagram-1782205972639",
    "nodes": [
        {
            "id": "title", "type": "text",
            "points": [{ "x": 32, "y": 16 }, { "x": 496, "y": 64 }],
            "text": "Software Access Subsystem",
            "textStyle": { "align": "center", "baseline": "bottom", "fontFace": "Georgia", "size": 22, "weight": 700, "orientation": "horizontal" },
            "strokeStyle": { "color": "#0f172a", "width": 1 },
            "fillStyle": "transparent", "hollow": true, "image_mode": "none"
        }, {
            "id": "round_rectangle-drop-1782206047672-ovcf8", "type": "round_rectangle",
            "points": [{ "x": -35.558415757393114, "y": 95.99999999999996 }, { "x": 108.44158424260591, "y": 144 }],
            "hollow": false, "text": "Users",
            "textStyle": { "color": "#0d6327", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 700, "italic": false, "halo": "transparent" },
            "ready": true,
            "strokeStyle": { "color": "#0d6327", "width": 2 },
            "fillStyle": "#d3effd",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } }
        }, {
            "id": "round_rectangle-drop-1782206049993-aoeqg", "type": "round_rectangle",
            "points": [{ "x": 208, "y": 96 }, { "x": 352, "y": 144 }],
            "hollow": false, "text": "Roles",
            "textStyle": { "color": "#0d6327", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 700, "italic": false, "halo": "transparent" },
            "ready": true, "strokeStyle": { "color": "#0d6327", "width": 2 },
            "fillStyle": "#d3effd",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } }
        }, {
            "id": "round_rectangle-drop-1782206052431-bs399", "type": "round_rectangle",
            "points": [{ "x": 432.00000000000136, "y": 95.99999999999996 }, { "x": 576, "y": 143.99999999999994 }],
            "hollow": false, "text": "Permissions",
            "textStyle": { "color": "#0d6327", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 700, "italic": false, "halo": "transparent" },
            "ready": true,
            "strokeStyle": { "color": "#0d6327", "width": 2 },
            "fillStyle": "#d3effd",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } }
        }, {
            "id": "rectangle-drop-1782206056828-x2vw4", "type": "rectangle",
            "points": [{ "x": 432, "y": 207.86645384778356 }, { "x": 576, "y": 271.8664538477836 }],
            "hollow": false, "text": "Events",
            "textStyle": { "color": "#459274", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 700, "italic": false, "halo": "transparent" },
            "ready": true,
            "strokeStyle": { "color": "#459274", "width": 2 },
            "fillStyle": "#ffffff",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } }
        }, {
            "id": "rectangle-drop-1782206059462-zzr4q", "type": "rectangle",
            "points": [{ "x": 208, "y": 208 }, { "x": 352, "y": 272 }], "hollow": false, "text": "Rules",
            "textStyle": { "color": "#0d6327", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 700, "italic": false, "halo": "transparent" },
            "ready": true,
            "strokeStyle": { "color": "#0d6327", "width": 2, "arrow": "end" },
            "fillStyle": "#d3effd",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } }
        }, {
            "id": "trapezoid-drop-1782206074206-0lji3", "type": "trapezoid",
            "points": [{ "x": -31.860236956736024, "y": 334.0750817223187 }, { "x": 111.80941403191275, "y": 412.9728595402143 }],
            "hollow": false, "text": "Requests",
            "textStyle": { "color": "#4c1d95", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 700, "italic": false, "halo": "transparent" },
            "ready": true,
            "strokeStyle": { "color": "#7c3aed", "width": 2 },
            "fillStyle": "#ede9fe",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } }
        }, {
            "id": "rhombus-drop-1782206090864-tibza", "type": "rhombus",
            "points": [{ "x": 239.99999999999991, "y": 332.4120651612177 }, { "x": 320.00000000000006, "y": 412.4120651612177 }],
            "hollow": false, "text": "Check",
            "textStyle": { "color": "#4c1d95", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 700, "italic": false, "halo": "transparent" },
            "ready": true,
            "strokeStyle": { "color": "#7c3aed", "width": 2, "arrow": "end" },
            "fillStyle": "#ede9fe",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } }
        }, {
            "id": "document-drop-1782206098409-frkde", "type": "document",
            "points": [{ "x": 431.67102231070123, "y": 478.69036620398015 }, { "x": 575.6710223107042, "y": 542.6903662039814 }],
            "hollow": false, "text": "Reports",
            "textStyle": { "color": "#456eb0", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 700, "italic": false, "halo": "transparent" },
            "ready": true,
            "strokeStyle": { "color": "#0f172a", "width": 2 },
            "fillStyle": "#ffffff",
            "shadowStyle": { "name": "Shadow", "color": "inherit", "blur": 8, "offset": { "x": 4, "y": 4 } }
        }, {
            "id": "parallelogram-drop-1782206107301-vbi0g", "type": "parallelogram",
            "points": [{ "x": 431.6710223106994, "y": 336.54952287465 }, { "x": 575.6710223107042, "y": 408.27460744778546 }],
            "hollow": false, "text": "Actions",
            "textStyle": { "color": "#456eb0", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 700, "italic": false, "halo": "transparent" },
            "ready": true,
            "strokeStyle": { "color": "#7c3aed", "width": 2 },
            "fillStyle": "#d3effd",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } }
        }, {
            "id": "rectangle-drop-1782206150129-r64b3", "type": "rectangle",
            "points": [{ "x": -30.652894917740355, "y": 209.91855035578752 }, { "x": 108.44158424260591, "y": 269.8143573397797 }],
            "hollow": false, "text": "Sessions",
            "textStyle": { "color": "#459274", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 700, "italic": false, "halo": "transparent" },
            "ready": true,
            "strokeStyle": { "color": "#459274", "width": 2 },
            "fillStyle": "#ffffff",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } }
        }, {
            "id": "line-draft-1782206385370", "type": "line",
            "points": [{ "x": 111.8154393738503, "y": 120 }, { "x": 207.8154393738503, "y": 120 }],
            "hollow": true, "text": "Member",
            "textStyle": { "color": "#0f172a", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "bottom", "orientation": "horizontal", "weight": 500, "italic": true, "halo": "inherit" },
            "ready": true,
            "strokeStyle": { "color": "#0f172a", "width": 1, "arrow": "end" },
            "fillStyle": "transparent",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } }
        }, {
            "id": "line-draft-1782206428606", "type": "line",
            "points": [{ "x": 352, "y": 120 }, { "x": 432.00000000000136, "y": 119.99999999999994 }],
            "hollow": true, "text": "Granted",
            "textStyle": { "color": "#0f172a", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "bottom", "orientation": "horizontal", "weight": 500, "italic": true, "halo": "inherit" },
            "ready": true,
            "strokeStyle": { "color": "#0f172a", "width": 1, "arrow": "end" },
            "fillStyle": "transparent",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } },
            "from": { "node": "round_rectangle-drop-1782206049993-aoeqg", "handle": "e" },
            "to": { "node": "round_rectangle-drop-1782206052431-bs399", "handle": "w" }
        }, {
            "id": "curve-draft-1782206457115", "type": "curve",
            "points": [{ "x": -35.558415757393114, "y": 119.99999999999997 }, { "x": -94.42108357037263, "y": 118.71832957101525 }, { "x": -154.59926530695287, "y": 266.28746342459425 }, { "x": -30.652894917740355, "y": 239.8664538477836 }],
            "hollow": true, "text": "Log In",
            "textStyle": { "color": "#0f172a", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "bottom", "orientation": "horizontal", "weight": 700, "italic": false, "halo": "inherit" },
            "ready": true,
            "strokeStyle": { "color": "#0f172a", "width": 1, "arrow": "end" },
            "fillStyle": "transparent",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } },
            "from": { "node": "round_rectangle-drop-1782206047672-ovcf8", "handle": "w" },
            "to": { "node": "rectangle-drop-1782206150129-r64b3", "handle": "w" }
        }, {
            "id": "line-draft-1782206587411", "type": "line",
            "points": [{ "x": 280, "y": 144 }, { "x": 280, "y": 208 }],
            "hollow": true, "text": "Declared",
            "textStyle": { "color": "#0f172a", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "bottom", "orientation": "horizontal", "weight": 500, "italic": true, "halo": "inherit" },
            "ready": true,
            "strokeStyle": { "color": "#0f172a", "width": 1, "arrow": "end" },
            "fillStyle": "transparent",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } },
            "from": { "node": "round_rectangle-drop-1782206049993-aoeqg", "handle": "s" },
            "to": { "node": "rectangle-drop-1782206059462-zzr4q", "handle": "n" }
        }, {
            "id": "line-draft-1782206670780", "type": "line",
            "points": [{ "x": 111.80941403191275, "y": 373.5239706312665 }, { "x": 239.99999999999991, "y": 372.4120651612177 }],
            "hollow": true, "text": "Submitted",
            "textStyle": { "color": "#0f172a", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "bottom", "orientation": "horizontal", "weight": 500, "italic": true, "halo": "inherit" },
            "ready": true,
            "strokeStyle": { "color": "#0f172a", "width": 1, "arrow": "end" },
            "fillStyle": "transparent",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } },
            "from": { "node": "trapezoid-drop-1782206074206-0lji3", "handle": "e" },
            "to": { "node": "rhombus-drop-1782206090864-tibza", "handle": "w" }
        }, {
            "id": "line-draft-1782206683351", "type": "line",
            "points": [{ "x": 320.00000000000006, "y": 372.4120651612177 }, { "x": 431.6710223106994, "y": 372.4120651612177 }],
            "hollow": true, "text": "Perform",
            "textStyle": { "color": "#0f172a", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "bottom", "orientation": "horizontal", "weight": 500, "italic": true, "halo": "inherit" },
            "ready": true,
            "strokeStyle": { "color": "#0f172a", "width": 1, "arrow": "end" },
            "fillStyle": "transparent",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } },
            "from": { "node": "rhombus-drop-1782206090864-tibza", "handle": "e" },
            "to": { "node": "parallelogram-drop-1782206107301-vbi0g", "handle": "w" }
        }, {
            "id": "manhattan-draft-1782206730629", "type": "manhattan",
            "points": [{ "x": 280, "y": 412.4120651612177 }, { "x": 503.6710223107027, "y": 478.69036620398015 }],
            "hollow": true, "text": "Issue",
            "textStyle": { "color": "#0f172a", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "bottom", "orientation": "horizontal", "weight": 500, "italic": true, "halo": "inherit" },
            "ready": true,
            "strokeStyle": { "color": "#0f172a", "width": 1, "arrow": "end" },
            "fillStyle": "transparent",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } },
            "from": { "node": "rhombus-drop-1782206090864-tibza", "handle": "s" },
            "geometry": { "from_handle": "s", "to_handle": "n" },
            "to": { "node": "document-drop-1782206098409-frkde", "handle": "n" }
        }, {
            "id": "line-draft-1782206923968", "type": "line",
            "points": [{ "x": 280, "y": 272 }, { "x": 280, "y": 332.4120651612177 }],
            "hollow": true, "text": "Uses",
            "textStyle": { "color": "#0f172a", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "bottom", "orientation": "horizontal", "weight": 500, "italic": true, "halo": "inherit" },
            "ready": true,
            "strokeStyle": { "color": "#0f172a", "width": 1, "arrow": "start" },
            "fillStyle": "transparent",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } },
            "from": { "node": "rectangle-drop-1782206059462-zzr4q", "handle": "s" },
            "to": { "node": "rhombus-drop-1782206090864-tibza", "handle": "n" }
        }, {
            "id": "curve-draft-1782212591550", "type": "curve",
            "points": [{ "x": -36.85041288781989, "y": 120.22355481068277 }, { "x": -103.73064682391546, "y": 180.33746149958725 }, { "x": -97.11170119382056, "y": 402.2276926790738 }, { "x": -31.860236956736024, "y": 412.9728595402143 }],
            "hollow": true, "text": "Issue",
            "textStyle": { "color": "#0f172a", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 700, "italic": false, "halo": "inherit" },
            "ready": true,
            "strokeStyle": { "color": "#0f172a", "width": 1, "arrow": "end" },
            "fillStyle": "transparent",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } },
            "to": { "node": "trapezoid-drop-1782206074206-0lji3", "handle": "sw" }
        }, {
            "id": "line-draft-1782212701801", "type": "line",
            "points": [{ "x": 503.6710223107018, "y": 336.54952287465 }, { "x": 504, "y": 271.8664538477836 }],
            "hollow": true, "text": "Store",
            "textStyle": { "color": "#0f172a", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 500, "italic": true, "halo": "inherit" },
            "ready": true,
            "strokeStyle": { "color": "#0f172a", "width": 1, "arrow": "end" },
            "fillStyle": "transparent",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } },
            "from": { "node": "parallelogram-drop-1782206107301-vbi0g", "handle": "n" },
            "to": { "node": "rectangle-drop-1782206056828-x2vw4", "handle": "s" }
        }, {
            "id": "manhattan-draft-1782212724191", "type": "manhattan",
            "points": [{ "x": 575.6710223107042, "y": 510.6903662039808 }, { "x": 602.8587895213109, "y": 238.44315089536516 }, { "x": 576, "y": 239.8664538477836 }],
            "hollow": true, "text": "Store",
            "textStyle": { "color": "#0f172a", "fontFace": "Helvetica", "size": 12, "align": "center", "baseline": "middle", "orientation": "horizontal", "weight": 500, "italic": true, "halo": "inherit" },
            "ready": true,
            "strokeStyle": { "color": "#0f172a", "width": 1, "arrow": "end" },
            "fillStyle": "transparent",
            "shadowStyle": { "name": "Custom", "color": "transparent", "blur": 0, "offset": { "x": 0, "y": 0 } },
            "from": { "node": "document-drop-1782206098409-frkde", "handle": "e" },
            "geometry": { "from_handle": "e", "to_handle": "e" },
            "to": { "node": "rectangle-drop-1782206056828-x2vw4", "handle": "e" }
        }], "layers": [
            {
                "id": "main", "name": "main", "visible": true, "nodes": [
                    "title", "round_rectangle-drop-1782206047672-ovcf8",
                    "round_rectangle-drop-1782206049993-aoeqg",
                    "round_rectangle-drop-1782206052431-bs399",
                    "rectangle-drop-1782206056828-x2vw4",
                    "rectangle-drop-1782206059462-zzr4q",
                    "trapezoid-drop-1782206074206-0lji3",
                    "rhombus-drop-1782206090864-tibza",
                    "document-drop-1782206098409-frkde",
                    "parallelogram-drop-1782206107301-vbi0g",
                    "rectangle-drop-1782206150129-r64b3",
                    "line-draft-1782206385370",
                    "line-draft-1782206428606",
                    "curve-draft-1782206457115",
                    "line-draft-1782206587411",
                    "line-draft-1782206670780",
                    "line-draft-1782206683351",
                    "manhattan-draft-1782206730629",
                    "line-draft-1782206923968",
                    "curve-draft-1782212591550",
                    "line-draft-1782212701801",
                    "manhattan-draft-1782212724191"]
            }]
});

setTimeout(() => {
    view.fitToNodes(48, { horizontal: 'center', vertical: 'center' });
}, 300);
