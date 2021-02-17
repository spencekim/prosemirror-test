import { ListActionsPlugin } from './plugins/listActionsPlugin';
import { insertTab } from './insertTab';
import { wrapInList } from './commands';
import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from './schema';
import { undo, redo, history } from 'prosemirror-history';
import { ListPlugin } from './plugins/startListPlugin';

export interface Editor {
    view: EditorView;
    destroy: () => void;
}

interface EditorArgs {
    div: HTMLDivElement;
}

//tests
export function createEditor(args: EditorArgs): Editor {
    const { div } = args;

    const state = EditorState.create({
        schema,
        plugins: [
            ListPlugin,
            ListActionsPlugin,
            history({ newGroupDelay: 300 }),
            keymap({
                'Mod-z': undo,
                'Mod-Shift-z': redo,
                Tab: insertTab,
                'Mod-o': wrapInList(schema.nodes.bulletList, {})
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
