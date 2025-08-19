import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, ImagePlus, PlusCircle } from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { app } from "../firebaseConfig";

const AddIngredientModal = ({
  isOpen,
  onClose,
  onIngredientAdded,
  currentIngredient = null,
}) => {
  const [name, setName] = useState(
    currentIngredient ? currentIngredient.name : "",
  );
  const [price, setPrice] = useState(
    currentIngredient ? currentIngredient.price : "",
  );
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(
    currentIngredient ? currentIngredient.image : "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const storage = getStorage(app);
  const db = getFirestore(app);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImageUrl(URL.createObjectURL(e.target.files[0])); // Show preview
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name || !price) {
      setError("Por favor, completa todos los campos.");
      setLoading(false);
      return;
    }

    let finalImageUrl = imageUrl;
    if (imageFile) {
      try {
        const imageRef = ref(
          storage,
          `ingredient_images/${Date.now()}-${imageFile.name}`,
        );
        const snapshot = await uploadBytes(imageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.error("Error uploading image:", err);
        setError("Error al subir la imagen. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }
    } else if (!currentIngredient) {
      // If it's a new ingredient and no image is provided
      setError("Por favor, sube una imagen para el nuevo ingrediente.");
      setLoading(false);
      return;
    }

    const newIngredientData = {
      id: currentIngredient ? currentIngredient.id : `custom_${Date.now()}`,
      name: name,
      price: parseFloat(price),
      icon: currentIngredient ? currentIngredient.icon : "✨", // Default icon for custom ingredients
      image: finalImageUrl,
      isCustom: true,
    };

    try {
      // Update a document in Firestore (e.g., a 'market' document or a 'custom_ingredients' collection)
      // For simplicity, let's assume a single 'market_data' document for now
      const marketDocRef = doc(db, "market", "ingredients_list");
      await updateDoc(
        marketDocRef,
        {
          customIngredients: arrayUnion(newIngredientData),
        },
        { merge: true },
      ); // Use merge to add to array without overwriting

      onIngredientAdded(newIngredientData);
      onClose();
    } catch (err) {
      console.error("Error adding/updating ingredient in Firestore:", err);
      setError("Error al guardar el ingrediente. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {currentIngredient
            ? "Actualizar Ingrediente"
            : "Agregar Nuevo Ingrediente"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Nombre del Ingrediente
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none"
              placeholder="Ej: Tomate cherry"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Precio
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none"
              placeholder="Ej: 3.50"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Imagen del Ingrediente
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="ingredient-image-upload"
              />
              <label
                htmlFor="ingredient-image-upload"
                className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400 transition-all"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <ImagePlus className="w-8 h-8 text-gray-400" />
                )}
              </label>
              <p className="text-gray-500 text-sm">
                {imageFile ? imageFile.name : "Haz clic para subir una imagen"}
              </p>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <motion.button
            type="submit"
            className={`w-full py-3 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 ${
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
            }`}
            whileHover={loading ? {} : { scale: 1.02 }}
            whileTap={loading ? {} : { scale: 0.98 }}
            disabled={loading}
          >
            {loading
              ? "Guardando..."
              : currentIngredient
                ? "Actualizar Ingrediente"
                : "Agregar Ingrediente"}
            {!loading && <PlusCircle className="w-5 h-5" />}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddIngredientModal;
