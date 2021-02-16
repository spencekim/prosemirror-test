import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { EditorView } from 'prosemirror-view';
import { createEditor } from './pm/editorUtils';

interface EditorProps {
    editorView: React.MutableRefObject<EditorView | undefined>;
}

const EditorDiv = styled.div`
    border: 1px solid grey;
`;

const Editor: React.FC<EditorProps> = ({ editorView }) => {
    const editorDiv = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorDiv.current == null) {
            return;
        }
        const editor = createEditor({
            div: editorDiv.current
        });

        editorView.current = editor.view;

        return () => editor.destroy();
    }, [editorDiv]);

    return <EditorDiv ref={editorDiv}></EditorDiv>;
};

export default Editor;
