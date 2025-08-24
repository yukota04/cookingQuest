import React from 'react';
import { motion } from 'framer-motion';

const IntroScreen = ({ onLoaded }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen w-full flex items-center justify-center bg-black"
        >
            <video
                src="/intro/intro.mp4"
                autoPlay
                muted
                onEnded={onLoaded}
                className="w-full h-full object-cover"
            />
        </motion.div>
    );
};

export default IntroScreen;