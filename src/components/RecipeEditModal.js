import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImagePlus, PlusCircle, Trash2, Clock, Save, Camera, Upload, ArrowLeft, Plus } from 'lucide-react';
import { getFirestore, doc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../firebaseConfig';
import NotificationModal from './NotificationModal';

// Lista de nacionalidades predefinidas. Puede ser expandida.
const NATIONALITIES_LIST = [
    'Internacional', 'Venezolana', 'Colombiana', 'Mexicana', 'Italiana', 'Japonesa', 'Francesa', 'Española', 'Peruana',
];

const STEP_TYPES = [
    { value: 'preparar', label: '🔪 Preparar (Picar, Cortar...)' },
    { value: 'mezclar', label: '🥣 Mezclar (Batir, Licuar...)' },
    { value: 'cocinar', label: '🔥 Cocinar (Freír, Hervir...)', hasUtensil: true },
    { value: 'hornear', label: '♨️ Hornear (Precalentar...)', hasUtensil: true },
    { value: 'reposar', label: '⏳ Reposar / Enfriar' },
    { value: 'servir', label: '🍽️ Servir / Decorar' },
    { value: 'otro', label: '📝 Otro' },
];

const UTENSILS = {
    cocinar: ['Cocina', 'Leña'],
    hornear: ['Horno'],
};

const TEMPERATURE_OPTIONS = {
    Cocina: ['Baja', 'Media', 'Alta'],
    Leña: ['Fogón', 'Asador'],
};

const INITIAL_INGREDIENT = { id: Date.now(), quantity: '', name: '', image: null, imageFile: null, imagePreview: '' };
const INITIAL_STEP = { 
    id: Date.now(), 
    type: 'preparar', 
    instruction: '', 
    time: '', 
    utensil: '',
    temperature: '', 
    image: null, 
    imageFile: null, 
    imagePreview: '' 
};

const INITIAL_STATE = {
  name: '',
  description: '',
  totalTime: '',
  imageUrl: '',
  ingredients: [INITIAL_INGREDIENT],
  steps: [INITIAL_STEP],
  nationality: '',
};

const RecipeEditModal = ({ isOpen, onClose, recipeToEdit, onSave }) => {
  const [recipeData, setRecipeData] = useState(INITIAL_STATE);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [imageTarget, setImageTarget] = useState({ type: null, index: null });
  const [addingNewNationality, setAddingNewNationality] = useState(false);
  const [newNationality, setNewNationality] = useState('');
  const [nationalities, setNationalities] = useState(NATIONALITIES_LIST);

  const fileInputRef = useRef(null);

  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);
  const currentUser = auth.currentUser;

  // Estados para el nuevo modal de notificación
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'info' });

  // Función para mostrar el modal de notificación
  const showNotification = (message, type) => {
    setNotification({ isOpen: true, message, type });
  };

  // Función para cerrar el modal de notificación
  const closeNotification = () => {
    setNotification({ ...notification, isOpen: false });
    if (notification.type === 'success') {
      onClose(); // Cierra el modal de edición después de una notificación de éxito
    }
  };

  useEffect(() => {
    setNationalities(NATIONALITIES_LIST);
    if (isOpen) {
      if (recipeToEdit && recipeToEdit.id) {
        setRecipeData({
          ...recipeToEdit,
          ingredients: (recipeToEdit.ingredients || []).map((ing, i) => ({ ...INITIAL_INGREDIENT, ...ing, id: i, imageFile: null, imagePreview: ing.image || '' })),
          steps: (recipeToEdit.steps || []).map((step, i) => ({ ...INITIAL_STEP, ...step, id: i, imageFile: null, imagePreview: step.image || '' })),
        });
        setMainImagePreview(recipeToEdit.imageUrl);
      } else {
        setRecipeData(INITIAL_STATE);
        setMainImagePreview('');
        setMainImageFile(null);
      }
      setError('');
    }
  }, [isOpen, recipeToEdit]);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setRecipeData(prev => ({ ...prev, [name]: value }));
  };

  const handleMainImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files.item(0);
        setMainImageFile(file);
        setMainImagePreview(URL.createObjectURL(file));
    }
    closeImagePickerModal();
  };

  const handleIngredientImageChange = (index, e) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const newIngredients = [...recipeData.ingredients];
          newIngredients[index].imageFile = file;
          newIngredients[index].imagePreview = URL.createObjectURL(file);
          setRecipeData(prev => ({ ...prev, ingredients: newIngredients }));
      }
      closeImagePickerModal();
  };

  const handleStepImageChange = (index, e) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const newSteps = [...recipeData.steps];
          newSteps[index].imageFile = file;
          newSteps[index].imagePreview = URL.createObjectURL(file);
          setRecipeData(prev => ({ ...prev, steps: newSteps }));
      }
      closeImagePickerModal();
  };

  const handleFileChange = (e) => {
      const { type, index } = imageTarget;
      if (type === 'main') {
          handleMainImageChange(e);
      } else if (type === 'ingredient') {
          handleIngredientImageChange(index, e);
      } else if (type === 'step') {
          handleStepImageChange(index, e);
      }
  };

  const openCamera = () => {
    fileInputRef.current.setAttribute('capture', 'environment');
    fileInputRef.current.click();
  };

  const openImagePickerModal = (type, index = null) => {
    setIsImagePickerOpen(true);
    setImageTarget({ type, index });
  };

  const closeImagePickerModal = () => {
    setIsImagePickerOpen(false);
    setImageTarget({ type: null, index: null });
  };

  // --- MANEJADORES DE INGREDIENTES ---
  const handleIngredientTextChange = (index, e) => {
    const { name, value } = e.target;
    const newIngredients = [...recipeData.ingredients];
    newIngredients[index][name] = value;
    setRecipeData(prev => ({ ...prev, ingredients: newIngredients }));
  };
  
  const addIngredientField = () => {
    setRecipeData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ...INITIAL_INGREDIENT, id: Date.now() }]
    }));
  };

  const removeIngredientField = (index) => {
    const newIngredients = recipeData.ingredients.filter((_, i) => i !== index);
    setRecipeData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  // --- MANEJADORES DE PASOS (ACTUALIZADOS) ---
  const handleStepFieldChange = (index, e) => {
    const { name, value } = e.target;
    const newSteps = [...recipeData.steps];
    newSteps[index][name] = value;

    if (name === 'type') {
        newSteps[index].utensil = '';
        newSteps[index].temperature = '';
    }
    if (name === 'utensil') {
        newSteps[index].temperature = '';
    }

    setRecipeData(prev => ({ ...prev, steps: newSteps }));
  };

  const addStepField = () => {
    setRecipeData(prev => ({
      ...prev,
      steps: [...prev.steps, { ...INITIAL_STEP, id: Date.now() }]
    }));
  };

  const removeStepField = (index) => {
    const newSteps = recipeData.steps.filter((_, i) => i !== index);
    setRecipeData(prev => ({ ...prev, steps: newSteps }));
  };
  
  const handleNationalityChange = (e) => {
      setRecipeData(prev => ({ ...prev, nationality: e.target.value }));
  };

  const handleAddNewNationality = () => {
      if (newNationality && !nationalities.some(n => n.toLowerCase() === newNationality.toLowerCase())) {
          setNationalities(prev => [...prev, newNationality]);
          setRecipeData(prev => ({ ...prev, nationality: newNationality }));
          setNewNationality('');
          setAddingNewNationality(false);
      } else if (nationalities.some(n => n.toLowerCase() === newNationality.toLowerCase())) {
          showNotification("Esta nacionalidad ya existe en la lista.", "info");
      } else {
          showNotification("Por favor, ingresa una nacionalidad.", "error");
      }
  };

  // --- LÓGICA PARA GUARDAR (CORREGIDA) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
        showNotification("Debes iniciar sesión para guardar recetas.", "error");
        return;
    }
    setLoading(true);
    setError('');

    try {
      let finalRecipeImageUrl = (recipeToEdit && recipeToEdit.imageUrl) ? recipeToEdit.imageUrl : '';
      if (mainImageFile) {
        const imageRef = ref(storage, `recipe_images/${Date.now()}-${mainImageFile.name}`);
        const snapshot = await uploadBytes(imageRef, mainImageFile);
        finalRecipeImageUrl = await getDownloadURL(snapshot.ref);
      }

      const ingredientsWithImageUrls = await Promise.all(
        recipeData.ingredients.map(async (ing) => {
          let imageUrl = ing.image;
          if (ing.imageFile) {
            const ingImageRef = ref(storage, `ingredient_images/${Date.now()}-${ing.imageFile.name}`);
            const snapshot = await uploadBytes(ingImageRef, ing.imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
          }
          return { quantity: ing.quantity, name: ing.name, image: imageUrl };
        })
      );

      const stepsWithImageUrls = await Promise.all(
        recipeData.steps.map(async (step) => {
            let imageUrl = step.image;
            if (step.imageFile) {
                const stepImageRef = ref(storage, `step_images/${Date.now()}-${step.imageFile.name}`);
                const snapshot = await uploadBytes(stepImageRef, step.imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }
            return { type: step.type, instruction: step.instruction, time: step.time, utensil: step.utensil, temperature: step.temperature, image: imageUrl };
        })
      );

      // Objeto de datos limpio para Firestore
      const finalRecipeData = {
        name: recipeData.name,
        description: recipeData.description,
        totalTime: recipeData.totalTime,
        imageUrl: finalRecipeImageUrl,
        ingredients: ingredientsWithImageUrls,
        steps: stepsWithImageUrls,
        author: currentUser.displayName || currentUser.email.split('@')[0],
        authorId: currentUser.uid,
        updatedAt: serverTimestamp(),
        // CORRECCIÓN: Asignar un valor por defecto si no se ha seleccionado nada.
        nationality: recipeData.nationality || 'Internacional',
      };

      if (recipeToEdit && recipeToEdit.id) {
        const recipeDocRef = doc(db, 'recipes', recipeToEdit.id);
        await updateDoc(recipeDocRef, finalRecipeData);
        showNotification("Receta actualizada con éxito!", "success");
      } else {
        finalRecipeData.createdAt = serverTimestamp();
        finalRecipeData.averageRating = 0;
        finalRecipeData.ratingCount = 0;
        await addDoc(collection(db, 'recipes'), finalRecipeData);
        showNotification("Receta creada con éxito!", "success");
      }

      onSave(finalRecipeData); // Pasa los datos finales para la actualización en la biblioteca
    } catch (err) {
      console.error("Error detallado al guardar receta:", err);
      showNotification("Error al guardar la receta. Revisa la consola para más detalles.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-3xl h-[95vh] relative"
            >
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-7 h-7" />
              </button>
    
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                {recipeToEdit && recipeToEdit.id ? 'Editar Receta' : 'Crear Nueva Receta'}
              </h2>
    
              <form onSubmit={handleSubmit} className="space-y-5 h-[calc(100%-80px)] overflow-y-auto pr-4">
                {/* --- SECCIONES DE DATOS GENERALES, IMAGEN PRINCIPAL E INGREDIENTES --- */}
                <input name="name" value={recipeData.name} onChange={handleDataChange} placeholder="Nombre de la receta" className="w-full text-xl font-semibold px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-400" required />
                <textarea name="description" value={recipeData.description} onChange={handleDataChange} placeholder="Descripción breve y apetitosa..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-400" rows="3" required />
                <div className="flex items-center gap-4">
                  <Clock className="w-6 h-6 text-gray-500" />
                  <input name="totalTime" value={recipeData.totalTime} onChange={handleDataChange} placeholder="Tiempo total (ej: 45 min)" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-400" required />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Nacionalidad</label>
                  <div className="flex items-center gap-2">
                      {!addingNewNationality ? (
                          <>
                              <select
                                  name="nationality"
                                  value={recipeData.nationality}
                                  onChange={handleNationalityChange}
                                  className="flex-grow px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 bg-white"
                              >
                                  <option value="">Seleccionar Nacionalidad</option>
                                  {nationalities.map(nat => (
                                      <option key={nat} value={nat}>{nat}</option>
                                  ))}
                              </select>
                              <motion.button
                                  type="button"
                                  onClick={() => setAddingNewNationality(true)}
                                  className="p-3 text-teal-500 hover:bg-teal-100 rounded-full"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                              >
                                  <Plus className="w-5 h-5" />
                              </motion.button>
                          </>
                      ) : (
                          <div className="flex gap-2 w-full">
                              <input
                                  type="text"
                                  value={newNationality}
                                  onChange={(e) => setNewNationality(e.target.value)}
                                  placeholder="Nueva nacionalidad"
                                  className="flex-grow px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none"
                              />
                              <motion.button
                                  type="button"
                                  onClick={handleAddNewNationality}
                                  className="p-3 text-white bg-teal-500 hover:bg-teal-600 rounded-full"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                              >
                                  <Save className="w-5 h-5" />
                              </motion.button>
                              <motion.button
                                  type="button"
                                  onClick={() => setAddingNewNationality(false)}
                                  className="p-3 text-white bg-red-500 hover:bg-red-600 rounded-full"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                              >
                                  <X className="w-5 h-5" />
                              </motion.button>
                          </div>
                      )}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Imagen de la Receta</label>
                  <motion.button
                    type="button"
                    onClick={() => openImagePickerModal('main')}
                    className="w-full flex-shrink-0 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 transition-all"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {mainImagePreview ? <img src={mainImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl mb-4" /> : <Upload className="w-10 h-10 text-gray-400" />}
                    <p className="text-gray-500 text-sm">{mainImageFile ? mainImageFile.name : 'Sube una foto o usa la cámara.'}</p>
                  </motion.button>
                </div>
                <div className="border-t pt-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Ingredientes</h3>
                  {recipeData.ingredients.map((ing, index) => (
                    <div key={ing.id} className="flex items-center gap-2 mb-2">
                      <input name="quantity" value={ing.quantity} onChange={(e) => handleIngredientTextChange(index, e)} placeholder="Ej: 2 tazas" className="w-32 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none" />
                      <input name="name" value={ing.name} onChange={(e) => handleIngredientTextChange(index, e)} placeholder="Ej: Harina de trigo" className="flex-grow px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none" />
                      <motion.button
                        type="button"
                        onClick={() => openImagePickerModal('ingredient', index)}
                        className="p-2 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-teal-400"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                          {ing.imagePreview ? <img src={ing.imagePreview} alt="preview" className="w-6 h-6 object-cover rounded-full" /> : <ImagePlus className="w-5 h-5 text-gray-400" />}
                      </motion.button>
                      <button type="button" onClick={() => removeIngredientField(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                  <motion.button type="button" onClick={addIngredientField} className="mt-2 flex items-center gap-2 text-teal-500 font-semibold" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><PlusCircle className="w-5 h-5" />Añadir Ingrediente</motion.button>
                </div>
                
                {/* --- SECCIÓN DE PASOS (NUEVA Y MEJORADA) --- */}
                <div className="border-t pt-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Pasos de Preparación</h3>
                  {recipeData.steps.map((step, index) => {
                    const selectedType = STEP_TYPES.find(t => t.value === step.type) || {};
                    const availableUtensils = UTENSILS[step.type] || [];
                    const tempOptions = TEMPERATURE_OPTIONS[step.utensil] || [];

                    return (
                      <div key={step.id} className="bg-gray-50 p-4 rounded-xl mb-3 border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-500 text-lg">{index + 1}.</span>
                          <select name="type" value={step.type} onChange={(e) => handleStepFieldChange(index, e)} className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none bg-white">
                            {STEP_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                          </select>
                          <div className="flex-grow"></div>
                          <motion.button
                            type="button"
                            onClick={() => openImagePickerModal('step', index)}
                            className="p-2 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-teal-400"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {step.imagePreview ? <img src={step.imagePreview} alt="preview" className="w-6 h-6 object-cover rounded-full" /> : <ImagePlus className="w-5 h-5 text-gray-400" />}
                          </motion.button>
                          <button type="button" onClick={() => removeStepField(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        <textarea name="instruction" value={step.instruction} onChange={(e) => handleStepFieldChange(index, e)} placeholder="Describe la acción..." className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none mb-2" rows="2" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {/* --- TIEMPO --- */}
                          <input name="time" value={step.time} onChange={(e) => handleStepFieldChange(index, e)} placeholder="Tiempo (ej: 10 min)" className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none" />
                          
                          {/* --- UTENSILIO (si aplica) --- */}
                          {selectedType.hasUtensil && (
                            <select name="utensil" value={step.utensil} onChange={(e) => handleStepFieldChange(index, e)} className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none bg-white">
                              <option value="">Selecciona utensilio</option>
                              {availableUtensils.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          )}
    
                          {/* --- TEMPERATURA (condicional) --- */}
                          {selectedType.hasUtensil && step.utensil && (
                             <select name="temperature" value={step.temperature} onChange={(e) => handleStepFieldChange(index, e)} className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none bg-white">
                                <option value="">Selecciona nivel</option>
                                {TEMPERATURE_OPTIONS[step.utensil]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <motion.button type="button" onClick={addStepField} className="mt-2 flex items-center gap-2 text-teal-500 font-semibold" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><PlusCircle className="w-5 h-5" />Añadir Paso</motion.button>
                </div>
    
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    
                {/* --- BOTÓN DE GUARDAR --- */}
                <div className="pt-4">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
                    whileHover={loading ? {} : { scale: 1.02 }}
                    whileTap={loading ? {} : { scale: 0.98 }}
                  >
                    {loading ? 'Guardando...' : 'Guardar Receta'}
                    {!loading && <Save className="w-6 h-6" />}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para elegir la fuente de la imagen */}
      <AnimatePresence>
        {isImagePickerOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 20 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center"
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Añadir Imagen</h2>
                    <p className="text-gray-600 mb-6">Elige cómo quieres añadir tu foto.</p>
                    <div className="space-y-4">
                        <motion.button
                            type="button"
                            onClick={() => {
                                closeImagePickerModal();
                                fileInputRef.current.removeAttribute('capture');
                                fileInputRef.current.click();
                            }}
                            className="w-full flex items-center justify-center gap-3 bg-blue-500 text-white font-semibold py-3 rounded-xl cursor-pointer hover:bg-blue-600"
                            whileTap={{ scale: 0.98 }}
                        >
                            <ImagePlus className="w-6 h-6" />
                            Subir desde Galería
                        </motion.button>
                        <motion.button
                            type="button"
                            onClick={() => {
                                closeImagePickerModal();
                                fileInputRef.current.setAttribute('capture', 'environment');
                                fileInputRef.current.click();
                            }}
                            className="w-full flex items-center justify-center gap-3 bg-teal-500 text-white font-semibold py-3 rounded-xl hover:bg-teal-600"
                            whileTap={{ scale: 0.98 }}
                        >
                            <Camera className="w-6 h-6" />
                            Tomar Foto
                        </motion.button>
                    </div>
                    <motion.button
                        onClick={closeImagePickerModal}
                        className="mt-4 text-gray-500 hover:text-gray-700 font-semibold"
                    >
                        Cancelar
                    </motion.button>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>

    <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
    />

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

export default RecipeEditModal;