import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChefHat,
  BookOpen,
  Settings,
  User,
  MessageCircle,
  Sparkles,
  Clock,
  LogOut,
  Plus,
  Gamepad2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "../firebaseConfig";

const MainMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(location.state?.offline || false);
  const [showSupport, setShowSupport] = useState(false);
  const [user, setUser] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const auth = getAuth(app);
  const audioRef = React.useRef(null);

  // Reproducir música automáticamente al entrar al menú
  useEffect(() => {
    audioRef.current = document.getElementById("cooking_theme_music");
    if (audioRef.current && !isMusicPlaying) {
      audioRef.current.volume = 0.3;
      audioRef.current
        .play()
        .catch((e) => console.error("Error playing audio:", e));
      setIsMusicPlaying(true);
    }
  }, [isMusicPlaying]);

  // Manejar el estado de la música
  useEffect(() => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current
          .play()
          .catch((e) => console.error("Error playing audio:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMusicPlaying]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsOffline(false);
      } else {
        setUser(null);
        if (!location.state?.offline) {
          setIsOffline(true);
        }
      }
    });
    return () => unsubscribe();
  }, [auth, location.state?.offline]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Error al cerrar sesión. Inténtalo de nuevo.");
    }
  };

  const toggleMusic = () => {
    setIsMusicPlaying(!isMusicPlaying);
  };

  const menuItems = [
    {
      id: "cook",
      title: "Cocinar",
      subtitle: "Guía paso a paso",
      icon: ChefHat,
      color: "from-orange-500 to-red-500",
      route: "/recipes",
    },
    {
      id: "recipes",
      title: "Biblioteca de Recetas",
      subtitle: isOffline ? "No disponible offline" : "Descubre y comparte",
      icon: BookOpen,
      color: "from-green-500 to-teal-500",
      route: "/recipes",
    },
    {
      id: "community",
      title: "Comunidad",
      subtitle: isOffline ? "No disponible offline" : "Comparte tus creaciones",
      icon: MessageCircle,
      color: "from-purple-500 to-indigo-500",
      route: "/feed",
      disabled: isOffline,
    },
    {
      id: "profile",
      title: "Perfil",
      subtitle: isOffline ? "No disponible offline" : "Tu progreso",
      icon: User,
      color: "from-blue-500 to-indigo-500",
      route: "/profile",
      disabled: isOffline,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500">
      <motion.button
        onClick={() => setShowSupport(!showSupport)}
        className="absolute top-6 left-6 z-50 bg-white/20 backdrop-blur-md rounded-full p-3 text-white hover:bg-white/30 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
      {showSupport && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-20 left-6 bg-white rounded-2xl shadow-2xl p-6 w-80 z-40"
        >
          <h3 className="font-bold text-gray-800 mb-4">Soporte Técnico</h3>
          <div className="bg-gray-100 rounded-lg p-4 h-40 mb-4 overflow-y-auto">
            <div className="text-sm text-gray-600">
              <p className="mb-2">👋 ¡Hola! ¿En qué podemos ayudarte?</p>
              <p className="text-xs text-gray-400 italic">
                (Esta es una funcionalidad simulada. Para el envío de correos
                real, se requiere una configuración de backend.)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Escribe tu mensaje..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <button className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm">
              Enviar
            </button>
          </div>
        </motion.div>
      )}

      <motion.button
        onClick={toggleMusic}
        className="absolute top-6 right-6 z-50 bg-white/20 backdrop-blur-md rounded-full p-3 text-white hover:bg-white/30 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isMusicPlaying ? (
          <Volume2 className="w-6 h-6" />
        ) : (
          <VolumeX className="w-6 h-6" />
        )}
      </motion.button>

      <div className="pt-6 pb-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-white"
        >
          <div
            className={`w-3 h-3 rounded-full ${
              isOffline ? "bg-gray-400" : "bg-green-400"
            }`}
          ></div>
          <span className="text-sm font-semibold">
            {isOffline ? "Modo Offline" : "Conectado"}
          </span>
          {!isOffline && user && (
            <span className="text-sm text-white/80 ml-2">
              ({user.displayName || user.email})
            </span>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 px-6"
      >
        <motion.div
          className="inline-flex items-center gap-3 mb-4"
          whileHover={{ scale: 1.05 }}
        >
          <div className="bg-white/20 backdrop-blur-md rounded-full p-3">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">CookingQuest</h1>
          <Sparkles className="w-6 h-6 text-yellow-300" />
        </motion.div>
        <p className="text-white/80 text-lg">
          ¿Qué aventura culinaria vivirás hoy?
        </p>
      </motion.div>

      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => !item.disabled && navigate(item.route)}
                className={`relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-3xl p-6 text-left shadow-xl hover:shadow-2xl transition-all ${
                  item.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105"
                }`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={!item.disabled ? { y: -5 } : {}}
                whileTap={!item.disabled ? { scale: 0.98 } : {}}
                disabled={item.disabled}
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    className={`p-4 rounded-2xl bg-gradient-to-r ${item.color} shadow-lg`}
                    whileHover={{ rotate: 5 }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{item.subtitle}</p>
                    {item.disabled && (
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          Requiere conexión
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-lg"></div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center pb-6 mt-4"
      >
        <p className="text-white/60 text-sm">
          Versión 1.0 • Hecho con ❤️ para los amantes de la cocina
        </p>
      </motion.div>
    </div>
  );
};

export default MainMenu;
