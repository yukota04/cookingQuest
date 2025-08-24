import React from 'react';
import { motion } from 'framer-motion';

const AdPlacement = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-32 bg-gray-200 rounded-xl shadow-lg flex items-center justify-center p-4 text-center text-gray-500 font-semibold"
    >
      <p>Espacio Publicitario de Google AdSense</p>
    </motion.div>
  );
};

export default AdPlacement;