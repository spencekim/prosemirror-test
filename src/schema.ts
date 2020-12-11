/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mark, MarkSpec, NodeSpec, Schema } from 'prosemirror-model';

const linebreak: NodeSpec = {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() {
        // see the node view for the actual DOM
        return ['br'];
    }
};

const paragraph: NodeSpec = {
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM() {
        return ['p', 0];
    }
};

const nodes = {
    text: {
        group: 'inline'
    },
    doc: {
        content: 'block+'
    },
    linebreak,
    paragraph
};

const em: MarkSpec = {
    parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
    toDOM() {
        return ['em', 0];
    }
};

const strong: MarkSpec = {
    parseDOM: [
        { tag: 'strong' },
        // This works around a Google Docs misbehavior where
        // pasted content will be inexplicably wrapped in `<b>`
        // tags with a font-weight normal.
        {
            tag: 'b',
            getAttrs: (node: any) => node.style.fontWeight != 'normal' && null
        },
        {
            style: 'font-weight',
            getAttrs: (value: any) =>
                /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null
        }
    ],
    toDOM() {
        return ['strong', 0];
    }
};

const marks = {
    strong,
    em
};

export const schema = new Schema({ nodes, marks });
