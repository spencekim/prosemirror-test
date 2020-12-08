import { TransactionEvent } from './types';
import { schema } from 'prosemirror-schema-basic';
import { baseKeymap } from 'prosemirror-commands';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { RefObject } from 'react';

export const initEditorState = (): EditorState => {
    return EditorState.create({
        schema,
        plugins: [
            history(),
            keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo }),
            keymap(baseKeymap)
        ]
    });
};

export const generateNextEditorState = (
    event: TransactionEvent,
    editorView: EditorView,
    setEditorstate: (newState: EditorState) => void
): void => {
    if (event.type === 'EDITOR_TRANSACTION') {
        const newState = editorView.state.apply(event.transaction);
        setEditorstate(newState);
        editorView.updateState(newState);
    }
};
