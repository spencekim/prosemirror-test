import React, { useEffect, useRef, useState } from 'react';
import { EditorView } from 'prosemirror-view';

import { TransactionEvent } from './types';
import { generateNextEditorState, initEditorState } from './utils';
import { atom, useRecoilState } from 'recoil';

export const editorStateAtom = atom({
    key: 'editorState',
    default: initEditorState()
});

const App: React.FC = () => {
    const [editorState, setEditorState] = useRecoilState(editorStateAtom);

    const editorDiv = useRef<HTMLDivElement>(null);
    const editorView = useRef<EditorView | null>(null);

    // use setEditorState here somehow, right now new state is never set
    // react state and editor view are out of sync, make sure it goes through react
    const update = (event: TransactionEvent) => {
        if (editorView.current) {
            generateNextEditorState(event, editorView.current, setEditorState);
        }
    };

    useEffect(() => {
        if (editorDiv.current) {
            editorView.current = new EditorView(editorDiv.current, {
                state: editorState,
                dispatchTransaction(transaction) {
                    if (editorView.current) {
                        update({ type: 'EDITOR_TRANSACTION', transaction });
                    }
                }
            });
        }
        return () => editorView.current?.destroy();
    }, []);

    return <div ref={editorDiv}></div>;
};

export default App;
