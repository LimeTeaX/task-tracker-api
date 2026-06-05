import { useEffect, useRef } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
        {title && (
          <h3 className="text-lg font-bold mb-4 dark:text-gray-100">{title}</h3>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
