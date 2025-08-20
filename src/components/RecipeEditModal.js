import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ImagePlus, Plus, Trash2, Save, Star } from 'lucide-react'; // Added Star for difficulty
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../firebaseConfig';

const RecipeEditModal = ({ isOpen, onClose, recipe, onSave }) => {
  const [name, setName] = useState(recipe.name || '');
  const [description, setDescription] = useState(recipe.description || '');
  const [totalTime, setTotalTime] = useState(recipe.totalTime || '');
  const [difficulty, setDifficulty] = useState(recipe.difficulty || 'medio'); // New state for difficulty
  const [ingredients, setIngredients] = useState(recipe.ingredients || ['']);
  const [steps, setSteps] = useState(recipe.steps || [{ instruction: '', duration: 0, flameLevel: 'medio', ingredient: '', imageUrl: '' }]); // Added imageUrl to steps
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(recipe.imageUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const storage = getStorage(app);

  useEffect(() => {
    if (isOpen) {
      setName(recipe.name || '');
      setDescription(recipe.description || '');
      setTotalTime(recipe.totalTime || '');
      setDifficulty(recipe.difficulty || 'medio'); // Set difficulty
      setIngredients(recipe.ingredients || ['']);
      setSteps(recipe.steps || [{ instruction: '', duration: 0, flameLevel: 'medio', ingredient: '', imageUrl: '' }]);
      setImageFile(null);
      setImageUrl(recipe.imageUrl || '');
      setError('');
    }
  }, [isOpen, recipe]);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImageUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleStepImageChange = (index, file) => {
    if (file) {
      const newSteps = [...steps];
      newSteps[index].imageFile = file; // Store file temporarily
      newSteps[index].imageUrl = URL.createObjectURL(file); // Show preview
      setSteps(newSteps);
    }
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleRemoveIngredient = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const handleAddStep = () => {
    setSteps([...steps, { instruction: '', duration: 0, flameLevel: 'medio', ingredient: '', imageUrl: '' }]);
  };

  const handleRemoveStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !description || !totalTime || ingredients.some(ing => !ing.trim()) || steps.some(step => !step.instruction.trim())) {
      setError('Por favor, completa todos los campos obligatorios.');
      setLoading(false);
      return;
    }

    let finalImageUrl = imageUrl;
    if (imageFile) {
      try {
        const imageRef = ref(storage, `recipe_images/${Date.now()}-${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.error("Error uploading image:", err);
        setError('Error al subir la imagen de la receta. Inténtalo de nuevo.');
        setLoading(false);
        return;
      }
    }

    // Upload images for each step
    const stepsWithUploadedImages = await Promise.all(steps.map(async (step) => {
      if (step.imageFile) {
        try {
          const stepImageRef = ref(storage, `step_images/${Date.now()}-${step.imageFile.name}`);
          const snapshot = await uploadBytes(stepImageRef, step.imageFile);
          const stepImageUrl = await getDownloadURL(snapshot.ref);
          return { ...step, imageUrl: stepImageUrl, imageFile: null }; // Remove file object
        } catch (err) {
          console.error("Error uploading step image:", err);
          setError('Error al subir una imagen de paso. Inténtalo de nuevo.');
          return { ...step, imageFile: null }; // Continue without image if upload fails
        }
      }
      return { ...step, imageFile: null }; // Remove file object if no new file
    }));

    const recipeData = {
      ...recipe, // Keep existing data like authorId, createdAt etc.
      name,
      description,
      totalTime,
      difficulty, // Added difficulty
      ingredients: ingredients.filter(ing => ing.trim()),
      steps: stepsWithUploadedImages,
      imageUrl: finalImageUrl,
    };

    onSave(recipeData);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-3xl h-[90vh] overflow-y-auto relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {recipe.id ? 'Editar Receta' : 'Crear Nueva Receta'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Nombre de la Receta</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none"
              placeholder="Ej: Pollo al Curry"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none h-24"
              placeholder="Una breve descripción de tu deliciosa receta..."
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Tiempo Total de Preparación</label>
            <input
              type="text"
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none"
              placeholder="Ej: 45 minutos"
              required
            />
          </div>

          {/* Difficulty Selector */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Nivel de Dificultad</label>
            <div className="flex gap-2">
              {['facil', 'medio', 'dificil'].map((level) => (
                <motion.button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`flex-1 py-3 rounded-xl font-semibold capitalize ${
                    difficulty === level
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {level}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Imagen de la Receta</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="recipe-image-upload"
              />
              <label
                htmlFor="recipe-image-upload"
                className="flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400 transition-all"
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <ImagePlus className="w-12 h-12 text-gray-400" />
                )}
              </label>
              <p className="text-gray-500 text-sm">
                {imageFile ? imageFile.name : 'Haz clic para subir una imagen de tu receta'}
              </p>
            </div>
          </div>

          {/* Ingredients List */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Ingredientes</h3>
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => handleIngredientChange(index, e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none"
                  placeholder={`Ingrediente ${index + 1}`}
                  required
                />
                {ingredients.length > 1 && (
                  <motion.button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="bg-red-100 text-red-600 p-3 rounded-xl hover:bg-red-200 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            ))}
            <motion.button
              type="button"
              onClick={handleAddIngredient}
              className="w-full bg-blue-100 text-blue-600 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-200 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              Añadir Ingrediente
            </motion.button>
          </div>

          {/* Steps List */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Pasos de Preparación</h3>
            {steps.map((step, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-2xl mb-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">Paso {index + 1}</h4>
                  {steps.length > 1 && (
                    <motion.button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      className="bg-red-100 text-red-600 p-2 rounded-xl hover:bg-red-200 transition-all"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
                <textarea
                  value={step.instruction}
                  onChange={(e) => handleStepChange(index, 'instruction', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none h-20 mb-3"
                  placeholder="Instrucción del paso..."
                  required
                ></textarea>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Duración (min)</label>
                    <input
                      type="number"
                      value={step.duration}
                      onChange={(e) => handleStepChange(index, 'duration', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Nivel de Llama</label>
                    <select
                      value={step.flameLevel}
                      onChange={(e) => handleStepChange(index, 'flameLevel', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none bg-white"
                    >
                      <option value="bajo">Bajo</option>
                      <option value="medio">Medio</option>
                      <option value="alto">Alto</option>
                      <option value="apagado">Apagado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Ingrediente principal del paso</label>
                  <input
                    type="text"
                    value={step.ingredient}
                    onChange={(e) => handleStepChange(index, 'ingredient', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none"
                    placeholder="Ej: Pollo"
                  />
                </div>
                {/* Step Image Upload */}
                <div className="mt-3">
                  <label className="block text-gray-700 text-sm font-medium mb-1">Foto del Paso (Opcional)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleStepImageChange(index, e.target.files[0])}
                      className="hidden"
                      id={`step-image-upload-${index}`}
                    />
                    <label
                      htmlFor={`step-image-upload-${index}`}
                      className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400 transition-all"
                    >
                      {step.imageUrl ? (
                        <img src={step.imageUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <ImagePlus className="w-8 h-8 text-gray-400" />
                      )}
                    </label>
                    <p className="text-gray-500 text-sm">
                      {step.imageFile ? step.imageFile.name : 'Haz clic para subir una imagen'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <motion.button
              type="button"
              onClick={handleAddStep}
              className="w-full bg-blue-100 text-blue-600 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-200 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              Añadir Paso
            </motion.button>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <motion.button
            type="submit"
            className={`w-full py-3 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 ${
              loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600'
            }`}
            whileHover={loading ? {} : { scale: 1.02 }}
            whileTap={loading ? {} : { scale: 0.98 }}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Receta'}
            {!loading && <Save className="w-5 h-5" />}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default RecipeEditModal;