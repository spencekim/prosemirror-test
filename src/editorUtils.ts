import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from './schema';
import { undo, redo, history } from 'prosemirror-history';

export interface Editor {
    view: EditorView;
    destroy: () => void;
}

interface EditorArgs {
    div: HTMLDivElement;
}

//test
export function createEditor(args: EditorArgs): Editor {
    const { div } = args;

    const state = EditorState.create({
        schema,
        plugins: [
            history({ newGroupDelay: 300 }),
            keymap({
                'Mod-z': undo,
                'Mod-Shift-z': redo,
                'Mod-b': toggleMarkDebug(schema.marks.strong)
            }),
            keymap(baseKeymap)
        ]
    });

    const view: EditorView<typeof schema> = new EditorView(
        { mount: div },
        {
            state,
            dispatchTransaction(transaction) {
                const newState = view.state.apply(transaction);
                view.updateState(newState);
            }
        }
    );

    return {
        view,
        destroy: () => view.destroy()
    };
}
