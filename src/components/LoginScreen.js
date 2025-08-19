import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  getAuth,
  signInWithPopup,
  FacebookAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth";
import { app } from "../firebaseConfig";
import { MessageCircle, Facebook, Chrome } from "lucide-react";

const LoginScreen = () => {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new FacebookAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      navigate("/menu");
    } catch (error) {
      console.error("Error al iniciar sesión con Facebook:", error);
      setError("Error al iniciar sesión con Facebook. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/menu");
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      setError("Error al iniciar sesión con Google. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-xl max-w-sm w-full text-center"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">CookingQuest</h1>
        <p className="text-gray-600 mb-6">
          Inicia sesión para continuar tu aventura culinaria.
        </p>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

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
  );
};

export default LoginScreen;
