import React from 'react';
import { Button } from './ui/Button';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  error: string | null;
  title: string;
}

export const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, data, error, title }) => {
  if (!isOpen) return null;

  // Extract the actual response content safely
  // We check if 'response' key exists to avoid duplicating the entire object if it's our wrapped data
  const hasResponseKey = data && typeof data === 'object' && 'response' in data;
  const responseContent = hasResponseKey ? data.response : data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate pr-4">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e] space-y-6">
          {data?.request && (
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">REQUEST</span>
                  <div className="h-px flex-1 bg-gray-800"></div>
               </div>
               <pre className="text-xs font-mono text-blue-400 whitespace-pre-wrap break-all bg-blue-900/10 p-3 rounded border border-blue-900/30">
                 {JSON.stringify(data.request, null, 2)}
               </pre>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">RESPONSE</span>
                <div className="h-px flex-1 bg-gray-800"></div>
            </div>
            {error ? (
              <div className="text-red-400 font-mono text-sm p-3 bg-red-900/20 rounded border border-red-900/50">
                Error: {error}
              </div>
            ) : (
              <pre className="text-xs sm:text-sm font-mono text-green-400 whitespace-pre-wrap break-all bg-green-900/5 p-3 rounded border border-green-900/20">
                {JSON.stringify(responseContent, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
           <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};