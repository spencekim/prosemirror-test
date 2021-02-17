import { Node } from 'prosemirror-model';
import { Plugin, PluginKey, Selection, Transaction } from 'prosemirror-state';
import { schema } from '../schema';

export const ListActionsPlugin = new Plugin({
    key: new PluginKey('listActionsPlugin'),
    props: {
        handleKeyDown(view, event) {
            if (
                !(
                    event.code === 'Enter' ||
                    event.code === 'Backspace' ||
                    event.code === 'Tab' ||
                    (event.code === 'Tab' && event.shiftKey)
                )
            )
                return false;

            const shouldDispatch = false;
            const tr = view.state.tr;

            // if the currently selected range includes multiple listItem nodes,
            //   we need to handle each of these independently
            view.state.doc.nodesBetween(
                view.state.selection.from,
                view.state.selection.to,
                (node, pos, parent) => {
                    if (node.type === schema.nodes.text) {
                        if (parent.type === schema.nodes.bulletList) {
                            // this is a top level list item
                            shouldDispatch = handleTopLevelListItemKeyboardEvent(
                                tr,
                                view.state.selection,
                                event,
                                node,
                                pos,
                                parent
                            );
                        }
                        if (parent.type === schema.nodes.listItem) {
                            // this is a nested list item
                        }
                    }
                }
            );

            if (shouldDispatch) {
                // dispatch needs to be executed outside of the callback
                view.dispatch(tr);
                return true;
            }
            return false;
        }
    }
});

const handleTopLevelListItemKeyboardEvent = (
    tr: Transaction,
    selection: Selection,
    event: KeyboardEvent,
    node: Node,
    pos: number,
    parent: Node
): boolean => {
    switch (event.code) {
        case 'Enter':
            if (parent.childCount === 1 && node.content.size === 2) {
                // this <li> is empty (size = 2 means empty paragraph),
                //   and is the sole child of the enclosing <ul>,
                //   so replace the enclosing <ul> with an empty paragraph
                tr.replaceWith(
                    pos - 1,
                    pos - 1 + parent.nodeSize,
                    schema.nodes.paragraph.create()
                );
                return true;
            } else if (parent.childCount > 1 && node.content.size === 2) {
                // enclosing <ul> wraps at least one other <li> entry besides this one, and
                //   this <li> is empty, so exit the enclosing <ul> and replace position
                //   with an empty paragraph
            } else if (node.content.size > 2) {
                const nodeEnd = pos + node.nodeSize;
                if (selection.to < nodeEnd) {
                    return false;
                }
                // split non-empty listItem
                const newListItem = schema.nodes.listItem.create(
                    undefined,
                    schema.nodes.paragraph.create()
                );
                tr.replaceSelectionWith(newListItem);
                return true;
            }

            return false;
        case 'Backspace':
            if (parent.childCount === 1 && node.content.size === 0) {
                // this <li> is empty, and is the sole child of the enclosing <ul>,
                //   so replace the enclosing <ul> with an empty paragraph
                tr.replaceWith(
                    pos - 1,
                    pos - 1 + parent.nodeSize,
                    schema.nodes.paragraph.create()
                );
                return true;
            }
            return false;
        case 'Tab':
            if (event.shiftKey) {
                // shift tab event
            }
            if (parent.firstChild === node) {
                // don't allow first child to nest
                return true;
            }
            // eslint-disable-next-line no-case-declarations
            return true;
        default:
            return false;
    }
};
