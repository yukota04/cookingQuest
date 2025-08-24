import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const AdBanner = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 bg-yellow-400 text-yellow-900 rounded-2xl shadow-2xl p-4 flex items-center justify-between"
        >
          <div className="flex-1">
            <h3 className="font-bold text-lg">¡Anuncio!</h3>
            <p className="text-sm">¡Prueba nuestra nueva receta del día!</p>
          </div>
          <motion.button
            onClick={handleClose}
            className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdBanner;