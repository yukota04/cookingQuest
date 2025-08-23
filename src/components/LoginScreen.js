import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAuth,
  signInWithPopup,
  FacebookAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth";
import { app } from "../firebaseConfig";
import { MessageCircle, Facebook, Chrome, ChefHat } from "lucide-react";
import NotificationModal from "./NotificationModal";

const LoginScreen = () => {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const [loading, setLoading] = useState(false);
  
  // Estado para el modal de notificación
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'info' });

  // Función para mostrar el modal de notificación
  const showNotification = (message, type) => {
    setNotification({ isOpen: true, message, type });
  };

  // Función para cerrar el modal de notificación
  const closeNotification = () => {
    setNotification({ ...notification, isOpen: false });
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    const provider = new FacebookAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      navigate("/menu");
    } catch (error) {
      console.error("Error al iniciar sesión con Facebook:", error);
      showNotification("Error al iniciar sesión con Facebook. Inténtalo de nuevo.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/menu");
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      showNotification("Error al iniciar sesión con Google. Inténtalo de nuevo.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-xl max-w-sm w-full text-center"
        >
          <motion.div className="inline-flex items-center gap-3 mb-4"
            whileHover={{ scale: 1.05 }}>
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full p-2 shadow-lg">
              <ChefHat className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">CookingQuest</h1>
          </motion.div>
          <p className="text-gray-600 mb-6">
            Inicia sesión para continuar tu aventura culinaria.
          </p>

          {/* Botón de Iniciar sesión con Google */}
          <motion.button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-gray-700 font-bold py-3 px-4 rounded-full transition-all duration-200 flex items-center justify-center gap-2 mb-3 shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            {loading ? (
              "Cargando..."
            ) : (
              <>
                <Chrome className="w-5 h-5 text-red-500" />
                Iniciar sesión con Google
              </>
            )}
          </motion.button>

          {/* Botón de Iniciar sesión con Facebook */}
          <motion.button
            onClick={handleFacebookLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full transition-all duration-200 flex items-center justify-center gap-2 mb-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            {loading ? (
              "Cargando..."
            ) : (
              <>
                <Facebook className="w-5 h-5" />
                Iniciar sesión con Facebook
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <p className="text-white/60 text-sm">
            Versión 1.0 • Hecho con ❤️ para los amantes de la cocina
          </p>
        </motion.div>
      </div>
      
      {/* Modal de Notificación */}
      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        onClose={closeNotification}
        type={notification.type}
      />
    </>
  );
};

export default LoginScreen;
