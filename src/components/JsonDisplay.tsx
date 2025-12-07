'use client';

import { useMemo } from 'react';

interface JsonDisplayProps {
  data: unknown;
  initialExpanded?: boolean;
}

/**
 * JSON display component with syntax highlighting
 */
export default function JsonDisplay({ data }: JsonDisplayProps) {
  /**
   * Format and colorize JSON
   */
  const formattedJson = useMemo(() => {
    const jsonString = JSON.stringify(data, null, 2);
    
    // Apply syntax highlighting
    const highlighted = jsonString
      // Highlight keys
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
      // Highlight string values
      .replace(/: "([^"]*)"([,\n])/g, ': <span class="json-string">"$1"</span>$2')
      // Highlight numbers
      .replace(/: (-?\d+\.?\d*)([,\n])/g, ': <span class="json-number">$1</span>$2')
      // Highlight booleans
      .replace(/: (true|false)([,\n])/g, ': <span class="json-boolean">$1</span>$2')
      // Highlight null
      .replace(/: (null)([,\n])/g, ': <span class="json-null">$1</span>$2');
    
    return highlighted;
  }, [data]);

  return (
    <div className="relative">
      {/* Code block header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <div className="w-3 h-3 rounded-full bg-gray-300" />
          </div>
          <span className="text-2xs text-gray-500 font-mono ml-2">response.json</span>
        </div>
        <span className="text-2xs text-gray-400 font-mono">JSON</span>
      </div>
      
      <pre 
        className="bg-gray-50 text-gray-700 p-4 rounded-b-xl overflow-x-auto text-xs font-mono leading-relaxed border border-t-0 border-gray-200"
        style={{ maxHeight: '500px' }}
      >
        <code dangerouslySetInnerHTML={{ __html: formattedJson }} />
      </pre>
    </div>
  );
}
