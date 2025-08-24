import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Si el elemento de audio aún no existe, lo creamos
    if (!audioRef.current) {
      const audio = new Audio("/music/cooking_theme.mp3");
      audio.loop = true;
      audio.volume = 0.3;
      audioRef.current = audio;
    }

    // Controlamos la reproducción según el estado
    if (isPlaying) {
      audioRef.current
        .play()
        .catch((e) => console.error("Error playing audio:", e));
    } else {
      audioRef.current.pause();
    }

    // Función de limpieza para cuando el componente se desmonte
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isPlaying]);

  // Intentamos iniciar la música automáticamente al cargar
  useEffect(() => {
    setIsPlaying(true);
  }, []);

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.button
      onClick={toggleMusic}
      className="fixed bottom-4 right-4 z-50 bg-white/20 backdrop-blur-md rounded-full p-3 text-white hover:bg-white/30 transition-all"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {isPlaying ? (
        <Volume2 className="w-6 h-6" />
      ) : (
        <VolumeX className="w-6 h-6" />
      )}
    </motion.button>
  );
};

export default MusicPlayer;
