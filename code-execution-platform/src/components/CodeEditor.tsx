'use client';

import { Editor } from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
}

export default function CodeEditor({
  value,
  onChange,
  language = 'python',
  readOnly = false,
  height = '400px',
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  // Update language when it changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        // Map our language names to Monaco language IDs
        const monacoLanguage = language === 'javascript' || language === 'js' ? 'javascript' : 'python';
        // Use the monaco instance from the onMount callback to set the model language
        monacoRef.current.editor.setModelLanguage(model, monacoLanguage);
      }
    }
  }, [language]);

  // Map our language names to Monaco language IDs
  const monacoLanguage = language === 'javascript' || language === 'js' ? 'javascript' : 'python';

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300">
      <Editor
        key={`editor-${monacoLanguage}`}
        height={height}
        defaultLanguage={monacoLanguage}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          readOnly,
          wordWrap: 'on',
        }}
      />
    </div>
  );
}

