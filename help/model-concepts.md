---
title: Model Concepts
group: Guides
category: Concepts
---

# Model concepts

---

## Diagram

A diagram contains nodes arranged into groups and layers with required types and optional styles.

#### id

Each diagram has an identifier which is the default value used for the filename (but not necessarily).

#### nodes

A required array of all nodes in the diagram. Nodes referenced in groups/layers, connections, etc. must refer to a node from this array with its id.

#### layers

A required array of layers. If empty, then all nodes are in one default layer.
If layers are provided, then each node is rendered as dictated by its position in a layer.
Each layer has the following properties:
- `id`
- `name`
- `visible`
- `nodes`

#### groups

An optional array of groups. Each group is collection of nodes that should be selected together and maintain their relative positions.
Groups may be owned by a container node, so the exact same behaviour applies to members of a container.
Each group has the following properties:
- `id`
- `nodes`

#### background 

An object defining how the backdrop of the diagram is to be rendered. It has the following properties:
- `color`
- `gradient`

#### sheet_id

If the diagram uses a stylesheet, the `id` of the stylesheet is given by this property. If the sheet can be loaded, all its classes will be avilable to the editor. If not, only those classes used by the diagram are available.

#### meta

An application defined object with string keys and native values. This can be used for linking a diagram to another application area outside it.

#### image_assets

An object containing keys (image ids) and values (the actual images used in a diagram, encoded in base64 string format).
This object exists in diagram files. At runtume, assets are loaded into the diagrams asset store and can be read by the property `image_assets`.

---

## Node

The core concept of all diagrams is the node.
A node can be a shape or a connector and both are described with the same basic model.

#### id and type

Each node has a unique id generated on creation. That id refers to the node in groups, layers, connections, etc.
Type is a string defining what the node is. The code uses `type` to know how to render and interact with the node.

#### text

Not all nodes have text, but those that do render the value of the `text` property. This is plain text without markdown or html syntax.

#### style_class

If a node has a `style_class` value, this automatically declares the named style class in the diagram style sheet. 
Node properties are always in sync with the class definition so all nodes with the same style_class always look the same.

N.B. Each node holds a copy of the style properties to allow customizing that specific node when the `style_class` is unset.

#### textStyle

Text is rendered in the style defined by a textStyle object having the following properties:
- `color`
- `size`
- `fontFace`
- `weight`
- `italic`
- `halo`
- `underline`
- `align`
- `baseline`
- `orientation`

#### strokeStyle

Strokes (lines and curves; whether they are outlines or otherwise) are rendering using a strokeStyle object having the following properties:
- `color`
- `width`
- `dash`
- `arrow_start`
- `arrow_end`

#### fillStyle

The internal area of the node is rendered using this object and the following properties:
- `color`
- `gradient`

#### shadowStyle

A node may render a shadow or glow defined by the following properties:
- `color`
- `blur`
- `offset`

#### image

A node may contain an image. Images are identified by an id in the diagram's `asset_store`. 
Image styles have the following properties:
- `image_id`
- `mode`
- `align`
- `padding`

#### locked and locked_aspect

A node when `locked` cannot be moved or resized. It is not affected by autolayout algorithms.

#### invisible and hollow

An `invisible` node is not rendered in output and not considered in zoom-fitting or similar actions.
On the other hand, a `hollow` node ignore any `fillStyle` and only renders troke and text components.
In response to pointer events, invisible nodes do not respond while hollow nodes require the event to hit a stroked path or the rendered text but not the internal area of the node.

#### opacity

An integer number between 0 and 100 where 0 is fully transparent and 100 is fully opaque.

#### points

An array of points, each defined by x and y coordinates. Points have a meaning defined by each nodes `type`.
All rectangle-based nodes require only 2 points in the array; the top-left and bottom-right points.
Shapes such as polyline require as many points as necessary witrh the first and last being the start and end of the line.

#### angle

The rotation (in degrees) of the node if supported. Zero is due east, 90 degrees is due south, and -90 degrees is due north.

#### geometry

An object containing any values required by the nodes `type` for positioning or rendering. This is determined and used by the code for the relevant type.

#### specific

An object containing any values required by the nodes `type` but not used for positioning or rendering. This is determined and used by the code for the relevant type.

#### meta

An application defined object with string keys and native values. This can be used for linking a node to another application area outside the diagram.

---

## Containers

A container is a node that has a `type` supporting container behaviour as well as the following properties:
- `owns_group`

If a node is a container it can own a group of nodes with a unique id.
Groups cannot be nested, so if a node has a value for `owns_group` it cannot be grouped with other nodes.

---

## Connections

A connection is a node that has a `type` supporting connections as well as the following properties:
- `from`
- `to`

---

## Style Sheet

Despite each diagram being self-contained for rendeering with all required styles already in place, a user may choose to share styles across diagrams.
Style sheets can be exported from a diagram and imported into others. The classes defined in that stylesheet can then be applied to that diagram's nodes.

N.B. Node-specific attributes like points, geometry, angle, or opacity are NOT included in styles. 
Text and images are likewise NOT included in styles.

#### id and name

The `id` is a unique identifier used to refer to this sheet in diagrams.
The `name` is a human-friendly title of the spec sheet. Both are required.

#### version and description

The `version` and `description` of the style sheet are always optional.

#### diagram

An optional object with global diagram styles. Currently it defines the backdrop for the whole diagram canvas, defined as a color or gradient.
- `background`

#### classes

A required object with keys (style class names) and values (the full node style).
Each node style has the following properties:
- `textStyle`
- `strokeStyle`
- `fillStyle`
- `image`
- `shadowStyle`

