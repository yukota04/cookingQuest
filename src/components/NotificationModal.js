import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, CheckCircle } from 'lucide-react';

/**
 * Modal de notificación reutilizable.
 * Muestra un mensaje con un icono y un botón para cerrar.
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Indica si el modal está abierto.
 * @param {string} props.message - El mensaje a mostrar.
 * @param {function} props.onClose - La función para cerrar el modal.
 * @param {string} props.type - El tipo de mensaje ('success', 'error', 'info').
 */
const NotificationModal = ({ isOpen, message, onClose, type = 'info' }) => {
  let icon = null;
  let backgroundColor = 'bg-blue-500';

  if (type === 'success') {
    icon = <CheckCircle className="w-8 h-8 text-white" />;
    backgroundColor = 'bg-green-500';
  } else if (type === 'error') {
    icon = <XCircle className="w-8 h-8 text-white" />;
    backgroundColor = 'bg-red-500';
  } else {
    icon = <CheckCircle className="w-8 h-8 text-white" />; // Icono por defecto
    backgroundColor = 'bg-blue-500';
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.7, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.7, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm relative text-center flex flex-col items-center"
          >
            <div className={`w-16 h-16 rounded-full -mt-16 flex items-center justify-center shadow-lg ${backgroundColor}`}>
                {icon}
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">
              {type === 'success' ? '¡Éxito!' : type === 'error' ? '¡Error!' : 'Aviso'}
            </h2>
            <p className="text-gray-700 text-sm mb-6">{message}</p>
            <motion.button
              onClick={onClose}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cerrar
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;
