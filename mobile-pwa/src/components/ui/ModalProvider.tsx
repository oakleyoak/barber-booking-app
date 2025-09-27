import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModalContextType = {
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string) => Promise<string | null>;
  notify: (message: string, kind?: 'info' | 'success' | 'error') => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
    resolver?: (value: boolean) => void;
  }>({ open: false, message: '' });

  const [promptState, setPromptState] = useState<{
    open: boolean;
    message: string;
    value: string;
    resolver?: (value: string | null) => void;
  }>({ open: false, message: '', value: '' });

  const [toasts, setToasts] = useState<Array<{ id: number; message: string; kind?: string }>>([]);

  const confirm = (message: string, _title?: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ open: true, message, resolver: resolve });
    });
  };

  const prompt = (message: string, defaultValue = '') => {
    return new Promise<string | null>((resolve) => {
      setPromptState({ open: true, message, value: defaultValue, resolver: resolve });
    });
  };

  const notify = (message: string, kind: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const handleConfirmClose = (result: boolean) => {
    if (confirmState.resolver) confirmState.resolver(result);
    setConfirmState({ open: false, message: '' });
  };

  const handlePromptCancel = () => {
    if (promptState.resolver) promptState.resolver(null);
    setPromptState({ open: false, message: '', value: '' });
  };

  const handlePromptOk = () => {
    if (promptState.resolver) promptState.resolver(promptState.value);
    setPromptState({ open: false, message: '', value: '' });
  };

  return (
    <ModalContext.Provider value={{ confirm, prompt, notify }}>
      {children}

      {/* Confirm modal */}
      {confirmState.open && (
  <div className="fixed inset-0 z-50 flex modal-top justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-3">Confirm</h3>
            <p className="mb-4 text-sm text-gray-700">{confirmState.message}</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => handleConfirmClose(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white"
                onClick={() => handleConfirmClose(true)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt modal */}
      {promptState.open && (
  <div className="fixed inset-0 z-50 flex modal-top justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-3">Input</h3>
            <p className="mb-3 text-sm text-gray-700">{promptState.message}</p>
            <input
              className="w-full border px-3 py-2 rounded mb-4"
              value={promptState.value}
              onChange={(e) => setPromptState((s) => ({ ...s, value: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={handlePromptCancel}>
                Cancel
              </button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handlePromptOk}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-2 rounded shadow text-sm ${t.kind === 'error' ? 'bg-red-600 text-white' : t.kind === 'success' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ModalContext.Provider>
  );
};

export default ModalProvider;
