import { Node } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import { schema } from '../schema';

export const ListActionsPlugin = new Plugin({
    key: new PluginKey('listActionsPlugin'),
    props: {
        handleKeyDown(view, event) {
            const isEnterEvent = event.code === 'Enter';
            const isTabEvent = event.code === 'Tab';
            const isShiftTabEvent = event.code === 'Tab' && event.shiftKey;

            let shouldDispatch = false;
            const tr = view.state.tr;

            // if the currently selected range includes multiple listItem nodes,
            //   we need to handle each independently
            view.state.doc.nodesBetween(
                view.state.selection.from,
                view.state.selection.to,
                (node: Node, pos, parent) => {
                    if (node.type === schema.nodes.listItem) {
                        if (parent.type === schema.nodes.bulletList) {
                            // this is a top level list item
                            if (isEnterEvent) {
                                shouldDispatch = true;
                                // if enclosing <ul> is empty besides this <li>, and this <li> is empty,
                                //   replace the enclosing <ul> with an empty paragraph
                                tr.delete(pos - 1, pos - 1 + parent.nodeSize);
                                // if enclosing <ul> wraps at least one other <li> entry besides this one,
                                //   and this <li> is empty, exit the enclosing <ul> and replace position
                                //   with an empty paragraph
                                // if this <li> item is non-empty, split it
                            }
                        }
                        if (parent.type === schema.nodes.listItem) {
                            // this is a nested list item
                        }
                    }
                }
            );

            if (shouldDispatch) {
                event.preventDefault();
                view.dispatch(tr);
                return true;
            }

            if (isShiftTabEvent) event.preventDefault(); // shift tab will unfocus the editor otherwise
            if (!(isEnterEvent || isTabEvent || isShiftTabEvent)) return false;
            return false;
        }
    }
});

// const splitListItem = () => {};
