/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeSpec, Schema } from 'prosemirror-model';

const paragraph: NodeSpec = {
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM() {
        return ['p', 0];
    }
};

// :: NodeSpec
// A bullet list node spec, represented in the DOM as `<ul>`.
export const bulletList: NodeSpec = {
    content: 'listItem+',
    group: 'block',
    attrs: {
        nestingDepth: { default: 0 }
    },
    parseDOM: [{ tag: 'ul' }],
    toDOM() {
        return ['ul', 0];
    }
};

// :: NodeSpec
// A list item (`<li>`) spec.
export const listItem: NodeSpec = {
    content: 'paragraph* bulletList*',
    group: 'block',
    parseDOM: [{ tag: 'li' }],
    toDOM() {
        return ['li', 0];
    },
    defining: true
};

const nodes = {
    text: {
        group: 'inline'
    },
    doc: {
        content: 'block+'
    },
    paragraph,
    bulletList,
    listItem
};

export const schema = new Schema({ nodes });
