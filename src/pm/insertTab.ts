import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

export const insertTab = (
    state: EditorState,
    dispatch?: EditorView['dispatch']
) => {
    dispatch?.(state.tr.insertText('\t'));
    return true;
};
