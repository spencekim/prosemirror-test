import { Fragment, Node, NodeRange, Slice } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { schema } from '../schema';
import { canSplit, ReplaceAroundStep, liftTarget } from 'prosemirror-transform';

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

            let shouldDispatch = false;
            const tr = view.state.tr;
            switch (event.code) {
                case 'Enter':
                    shouldDispatch = splitListItem(tr, view.state);
                    break;
                case 'Tab':
                    if (event.shiftKey) {
                        // lift list item
                        shouldDispatch = liftListItem(tr, view.state);
                        break;
                    }
                    shouldDispatch = sinkListItem(tr, view.state);
                    break;
                case 'Backspace':
                    // delete current list item and go to end of previous list item
                    break;
            }

            if (shouldDispatch) {
                view.dispatch(tr);
                return true;
            }
            return false;
        }
    }
});

const liftListItem = (tr: Transaction, state: EditorState) => {
    const { $from, $to } = state.selection;
    const itemType = schema.nodes.listItem;

    const range = $from.blockRange(
        $to,
        (node) => node.childCount !== 0 && node.firstChild?.type == itemType
    );
    if (!range) return false;
    if ($from.node(range.depth - 1).type == itemType) {
        // Inside a parent list
        return liftToOuterList(range, tr);
    }
    // Outer list node
    return liftOutOfList(range, tr);
};

const liftToOuterList = (range: NodeRange, tr: Transaction) => {
    const end = range.end;
    const endOfList = range.$to.end(range.depth);
    if (end < endOfList) {
        // There are siblings after the lifted items, which must become
        // children of the last item
        tr.step(
            new ReplaceAroundStep(
                end - 1,
                endOfList,
                end,
                endOfList,
                new Slice(
                    Fragment.from(
                        schema.nodes.listItem.create(null, range.parent.copy())
                    ),
                    1,
                    0
                ),
                1,
                true
            )
        );
        range = new NodeRange(
            tr.doc.resolve(range.$from.pos),
            tr.doc.resolve(endOfList),
            range.depth
        );
    }
    tr.lift(range, liftTarget(range) as number);
    return true;
};

const liftOutOfList = (range: NodeRange, tr: Transaction) => {
    const list = range.parent;

    // Merge the list items into a single big item
    for (
        let pos = range.end, i = range.endIndex - 1, e = range.startIndex;
        i > e;
        i--
    ) {
        pos -= list.child(i).nodeSize;
        tr.delete(pos - 1, pos + 1);
    }
    const $start = tr.doc.resolve(range.start);
    const item = $start.nodeAfter as Node;
    const atStart = range.startIndex == 0;
    const atEnd = range.endIndex == list.childCount;
    const parent = $start.node(-1),
        indexBefore = $start.index(-1);

    if (
        !parent.canReplace(
            indexBefore + (atStart ? 0 : 1),
            indexBefore + 1,
            item.content.append(atEnd ? Fragment.empty : Fragment.from(list))
        )
    )
        return false;
    const start = $start.pos,
        end = start + item.nodeSize;
    // Strip off the surrounding list. At the sides where we're not at
    // the end of the list, the existing list is closed. At sides where
    // this is the end, it is overwritten to its end.
    tr.step(
        new ReplaceAroundStep(
            start - (atStart ? 1 : 0),
            end + (atEnd ? 1 : 0),
            start + 1,
            end - 1,
            new Slice(
                (atStart
                    ? Fragment.empty
                    : Fragment.from(list.copy(Fragment.empty))
                ).append(
                    atEnd
                        ? Fragment.empty
                        : Fragment.from(list.copy(Fragment.empty))
                ),
                atStart ? 0 : 1,
                atEnd ? 0 : 1
            ),
            atStart ? 0 : 1
        )
    );
    return true;
};

// Sink the list item around the selection down into an inner list
const sinkListItem = (tr: Transaction, state: EditorState) => {
    const { $from, $to } = state.selection;
    const itemType = schema.nodes.listItem;
    const range = $from.blockRange(
        $to,
        (p) => p.childCount !== 0 && p.firstChild?.type === itemType
    );
    if (!range) return false;
    const startIndex = range.startIndex;
    if (startIndex == 0) return false;
    const parent = range.parent,
        nodeBefore = parent.child(startIndex - 1);
    if (nodeBefore.type != itemType) return false;

    const nestedBefore =
        nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
    const inner = Fragment.from(
        nestedBefore ? schema.nodes.listItem.create() : undefined
    );
    const slice = new Slice(
        Fragment.from(
            itemType.create(
                null,
                Fragment.from(parent.type.create(null, inner))
            )
        ),
        nestedBefore ? 3 : 1,
        0
    );
    const before = range.start,
        after = range.end;
    tr.step(
        new ReplaceAroundStep(
            before - (nestedBefore ? 3 : 1),
            after,
            before,
            after,
            slice,
            1,
            true
        )
    );

    return true;
};

// Splits a textblock within a list item
const splitListItem = (tr: Transaction, state: EditorState) => {
    const { $from, $to } = state.selection;
    if ($from.depth < 2 || !$from.sameParent($to)) return false;
    if (
        !(
            $from.parent.type === schema.nodes.paragraph &&
            $from.node(-1).type === schema.nodes.listItem
        )
    )
        return false;

    if ($from.parent.content.size === 0) {
        // Empty block. If this is a nested list, the wrapping list item should be split.
        if (
            $from.node(-3).type !== schema.nodes.listItem ||
            $from.depth == 2 ||
            $from.index(-2) != $from.node(-2).childCount - 1
        )
            return false;

        let wrap = Fragment.empty;
        const keepItem = $from.index(-1) > 0;
        // Build a fragment containing empty versions of the structure
        // from the outer list item to the parent node of the cursor
        for (
            let d = $from.depth - (keepItem ? 1 : 2);
            d >= $from.depth - 3;
            d--
        )
            wrap = Fragment.from($from.node(d).copy(wrap));

        // Add a second list item with an empty default start node
        const newItem = schema.nodes.listItem.createAndFill();
        wrap = wrap.append(Fragment.from(newItem as any));

        tr.replace(
            $from.before(keepItem ? undefined : -1),
            $from.after(-3),
            new Slice(wrap, keepItem ? 3 : 2, 2)
        );
        return true;
    }
    const nextType =
        $to.pos == $from.end()
            ? $from.node(-1).contentMatchAt(0).defaultType
            : null;
    tr.delete($from.pos, $to.pos);
    const types = nextType && [undefined, { type: nextType }];
    if (!canSplit(tr.doc, $from.pos, 2, types as any)) return false;
    tr.split($from.pos, 2, types as any);
    return true;
};
