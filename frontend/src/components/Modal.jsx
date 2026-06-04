const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
