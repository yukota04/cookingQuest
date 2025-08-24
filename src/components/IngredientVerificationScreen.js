import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, ImagePlus, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../firebaseConfig";
import NotificationModal from './NotificationModal';

const IngredientVerificationScreen = ({ recipe, onStartCookingRealMode }) => {
  const navigate = useNavigate();
  const storage = getStorage(app);

  const [ingredientsStatus, setIngredientsStatus] = useState(() => {
    // Initialize status for each ingredient in the recipe
    return recipe.ingredients.map((ing) => ({
      name: ing.name,
      hasImage: false, // Assume no image initially
      imageUrl: null,
      isVerified: false, // Assume not verified initially
    }));
  });

  const handleImageUpload = async (index, file) => {
    if (!file) return;

    setIngredientsStatus((prevStatus) =>
      prevStatus.map((item, i) =>
        i === index ? { ...item, isUploading: true } : item,
      ),
    );

    try {
      const imageRef = ref(
        storage,
        `ingredient_real_images/${Date.now()}-${file.name}`,
      );
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setIngredientsStatus((prevStatus) =>
        prevStatus.map((item, i) =>
          i === index
            ? {
                ...item,
                hasImage: true,
                imageUrl: downloadURL,
                isVerified: true,
                isUploading: false,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen. Inténtalo de nuevo.");
      setIngredientsStatus((prevStatus) =>
        prevStatus.map((item, i) =>
          i === index ? { ...item, isUploading: false } : item,
        ),
      );
    }
  };

  const handleVerifyIngredient = (index) => {
    setIngredientsStatus((prevStatus) =>
      prevStatus.map((item, i) =>
        i === index ? { ...item, isVerified: !item.isVerified } : item,
      ),
    );
  };

  const allIngredientsVerified = ingredientsStatus.every(
    (ing) => ing.isVerified,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500">
      {/* Header */}
      <div className="bg-white/20 backdrop-blur-md p-4 flex items-center justify-between">
        <motion.button
          onClick={() => navigate("/recipes")}
          className="flex items-center gap-2 text-white font-semibold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Biblioteca
        </motion.button>
        <h1 className="text-2xl font-bold text-white">
          Verificación de Ingredientes
        </h1>
        <div className="w-10"></div> {/* Placeholder for alignment */}
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Receta: {recipe.name}
          </h2>
          <p className="text-gray-600 text-center mb-6">
            ¡Es hora de preparar tus ingredientes! Verifica que los tienes y, si
            quieres, sube una foto real.
          </p>

          <div className="space-y-4">
            {ingredientsStatus.map((ingredient, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center bg-gray-50 p-4 rounded-2xl shadow-sm"
              >
                <div className="flex-1 flex items-center gap-4">
                  {ingredient.imageUrl ? (
                    <img
                      src={ingredient.imageUrl}
                      alt={ingredient.name}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xl font-bold">
                      {ingredient.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {ingredient.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {ingredient.isVerified ? "Verificado" : "Pendiente"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Upload Image Button */}
                  <input
                    type="file"
                    accept="image/*"
                    id={`upload-image-${index}`}
                    className="hidden"
                    onChange={(e) =>
                      handleImageUpload(index, e.target.files[0])
                    }
                  />
                  <label
                    htmlFor={`upload-image-${index}`}
                    className={`p-2 rounded-full transition-all ${
                      ingredient.isUploading
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    } flex items-center justify-center`}
                    title="Subir foto real"
                  >
                    {ingredient.isUploading ? (
                      <span className="animate-spin">🌀</span> // Simple spinner
                    ) : (
                      <ImagePlus className="w-5 h-5" />
                    )}
                  </label>

                  {/* Verify Button */}
                  <motion.button
                    onClick={() => handleVerifyIngredient(index)}
                    className={`p-2 rounded-full transition-all ${
                      ingredient.isVerified
                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={ingredient.isVerified ? "Desverificar" : "Verificar"}
                  >
                    {ingredient.isVerified ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={onStartCookingRealMode}
            disabled={!allIngredientsVerified}
            className={`w-full mt-8 py-3 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 ${
              allIngredientsVerified
                ? "bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            whileHover={allIngredientsVerified ? { scale: 1.02 } : {}}
            whileTap={allIngredientsVerified ? { scale: 0.98 } : {}}
          >
            <Play className="w-6 h-6" />
            ¡Comenzar a Cocinar!
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default IngredientVerificationScreen;