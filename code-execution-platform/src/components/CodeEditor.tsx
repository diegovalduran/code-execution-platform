'use client';

import { Editor } from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(height);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  // Calculate height based on container or use provided height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current && height === '100%') {
        const containerHeight = containerRef.current.clientHeight;
        setEditorHeight(`${containerHeight}px`);
      } else {
        setEditorHeight(height);
      }
    };

    updateHeight();
    
    // If using 100%, listen for resize events
    if (height === '100%') {
      const resizeObserver = new ResizeObserver(updateHeight);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
      
      window.addEventListener('resize', updateHeight);
      
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateHeight);
      };
    }
  }, [height]);

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
    <div 
      ref={containerRef}
      className={`overflow-hidden ${height === '100%' ? 'h-full' : ''}`}
    >
      <Editor
        key={`editor-${monacoLanguage}`}
        height={editorHeight}
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

