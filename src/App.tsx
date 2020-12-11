import React, { useRef } from 'react';
import { EditorView } from 'prosemirror-view';
import styled from '@emotion/styled';
import Editor from './Editor';

const EditorContainer = styled.div`
    margin: 40;
`;

const App: React.FC = () => {
    const editorView = useRef<EditorView>();

    return (
        <EditorContainer>
            <Editor editorView={editorView} />
        </EditorContainer>
    );
};

export default App;
