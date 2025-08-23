import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Download, Heart, ChefHat, Star, Edit, Plus, Filter, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, orderBy, limit, doc, updateDoc, addDoc, serverTimestamp, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../firebaseConfig';
import RecipeDetailModal from './RecipeDetailModal';
import IngredientVerificationScreen from './IngredientVerificationScreen';
import RecipeEditModal from './RecipeEditModal';
import NotificationModal from './NotificationModal'; // Importamos el componente de notificación

const RecipeLibrary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null); // For modal
  const [isEditingRecipe, setIsEditingRecipe] = useState(false); // For editing
  const [currentCookingRecipe, setCurrentCookingRecipe] = useState(null); // For real cooking mode
  const [filterAuthorId, setFilterAuthorId] = useState(null); // New state for filtering by author
  const [filterDifficulty, setFilterDifficulty] = useState('all'); // New state for difficulty filter

  const db = getFirestore(app);
  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  // Estados para el modal de notificación
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'info' });

  // Función para mostrar el modal de notificación
  const showNotification = (message, type) => {
    setNotification({ isOpen: true, message, type });
  };

  // Función para cerrar el modal de notificación
  const closeNotification = () => {
    setNotification({ ...notification, isOpen: false });
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        let recipesQuery = collection(db, 'recipes');
        
        if (filterAuthorId) {
          recipesQuery = query(recipesQuery, where('authorId', '==', filterAuthorId));
        }
        if (filterDifficulty !== 'all') {
          recipesQuery = query(recipesQuery, where('difficulty', '==', filterDifficulty));
        }

        recipesQuery = query(recipesQuery, orderBy('createdAt', 'desc'), limit(20));
        
        const querySnapshot = await getDocs(recipesQuery);
        const fetchedRecipes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecipes(fetchedRecipes);
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError("No se pudieron cargar las recetas. Inténtalo de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [db, filterAuthorId, filterDifficulty]); // Re-fetch when filters change

  const handleOpenRecipeDetail = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleCloseRecipeDetail = () => {
    setSelectedRecipe(null);
    setIsEditingRecipe(false);
  };

  const handleStartCooking = (recipeToCook) => {
    setCurrentCookingRecipe(recipeToCook);
  };

  const handleStartCookingRealMode = () => {
    navigate('/cook-mode', { state: { recipe: currentCookingRecipe } });
  };

  const handleEditRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setIsEditingRecipe(true);
  };

  const handleSaveRecipe = async (updatedRecipeData) => {
    if (!currentUser) {
      showNotification("Debes iniciar sesión para guardar recetas.", "error");
      return;
    }

    try {
      if (updatedRecipeData.id) { // Existing recipe
        const recipeRef = doc(db, 'recipes', updatedRecipeData.id);
        await updateDoc(recipeRef, {
          ...updatedRecipeData,
          updatedAt: serverTimestamp(),
        });
        setRecipes(prev => prev.map(r => r.id === updatedRecipeData.id ? { ...r, ...updatedRecipeData } : r));
        showNotification("Receta actualizada con éxito!", "success");
      } else { // New recipe
        const newRecipeRef = await addDoc(collection(db, 'recipes'), {
          ...updatedRecipeData,
          authorId: currentUser.uid,
          author: currentUser.displayName || currentUser.email.split('@')[0],
          createdAt: serverTimestamp(),
          averageRating: 0,
          ratingCount: 0,
          userRatings: {},
          totalRatingSum: 0,
        });
        setRecipes(prev => [{ id: newRecipeRef.id, ...updatedRecipeData }, ...prev]);
        showNotification("Receta creada con éxito!", "success");
      }
      handleCloseRecipeDetail();
    } catch (err) {
      console.error("Error saving recipe:", err);
      showNotification("Error al guardar la receta. Inténtalo de nuevo.", "error");
    }
  };

  const handleFilterMyRecipes = () => {
    if (currentUser) {
      setFilterAuthorId(currentUser.uid);
    } else {
      showNotification("Debes iniciar sesión para ver tus recetas.", "info");
    }
  };

  const handleClearAuthorFilter = () => {
    setFilterAuthorId(null);
  };

  const handleDifficultyChange = (e) => {
    setFilterDifficulty(e.target.value);
  };

  const handleToggleFavorite = async (recipeId, isCurrentlyFavorite) => {
    if (!currentUser) {
      showNotification("Debes iniciar sesión para marcar recetas como favoritas.", "error");
      return;
    }
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userRef, {
        favoriteRecipes: isCurrentlyFavorite ? arrayRemove(recipeId) : arrayUnion(recipeId)
      });
      // Optimistically update UI or re-fetch user profile
      showNotification(isCurrentlyFavorite ? "Receta eliminada de favoritos." : "Receta añadida a favoritos!", "success");
    } catch (error) {
      console.error("Error updating favorite status:", error);
      showNotification("Error al actualizar favoritos.", "error");
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialStepsContent = [
    { title: "Bienvenido a la Biblioteca de Recetas", text: "Aquí puedes explorar y cocinar cientos de recetas. ¡Vamos a ver cómo funciona!" },
    { title: "Buscar Recetas", text: "Usa la barra de búsqueda para encontrar recetas por nombre o autor. ¿Buscas algo específico?" },
    { title: "Filtrar Recetas", text: "Usa el botón 'Mis Recetas' para ver solo las que tú has publicado. ¡Tu legado culinario!" },
    { title: "Filtrar por Dificultad", text: "Selecciona un nivel de dificultad para encontrar recetas que se ajusten a tus habilidades." },
    { title: "Marcar Favoritos", text: "Haz clic en el corazón para guardar tus recetas preferidas y encontrarlas fácilmente en tu perfil." },
    { title: "Ver Detalles de la Receta", text: "Haz clic en cualquier receta para ver sus ingredientes, pasos y comentarios. ¡No te pierdas ningún detalle!" },
    { title: "Empezar a Cocinar", text: "Una vez que elijas una receta, te guiaremos paso a paso en la cocina real. ¡Prepárate para la acción!" },
    { title: "Crear Nueva Receta", text: "Si te sientes inspirado, puedes crear y publicar tus propias recetas para que otros las disfruten. ¡Sé un Chef Estrella!" },
    { title: "¡Listo para Cocinar!", text: "Eso es todo por ahora. ¡Diviértete explorando y cocinando!" },
  ];

  const startTutorial = () => {
    setShowTutorial(true);
    setTutorialStep(0);
  };

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialStepsContent.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };

  if (currentCookingRecipe) {
    return (
      <IngredientVerificationScreen 
        recipe={currentCookingRecipe} 
        onStartCookingRealMode={handleStartCookingRealMode} 
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-teal-400 to-blue-500">
        {/* Header */}
        <div className="bg-white/20 backdrop-blur-md p-4 flex items-center justify-between">
          <motion.button
            onClick={() => navigate('/menu')}
            className="flex items-center gap-2 text-white font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Menú Principal
          </motion.button>

          <h1 className="text-2xl font-bold text-white">Biblioteca de Recetas</h1>

          <div className="flex gap-2">
            <motion.button
              className="bg-purple-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEditRecipe({})} // Pass empty object for new recipe
            >
              <Plus className="w-4 h-4" />
              Nueva Receta
            </motion.button>
            <motion.button
              className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startTutorial}
            >
              <ChefHat className="w-4 h-4" />
              Tutorial
            </motion.button>
          </div>
        </div>

        <div className="p-6 max-w-6xl mx-auto">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar recetas por nombre o autor..."
                className="w-full px-5 py-3 pl-12 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            <div className="flex gap-2">
              <motion.button
                onClick={handleFilterMyRecipes}
                className={`px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 ${
                  filterAuthorId ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Filter className="w-5 h-5" />
                Mis Recetas
              </motion.button>
              {filterAuthorId && (
                <motion.button
                  onClick={handleClearAuthorFilter}
                  className="px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 bg-red-100 text-red-600 hover:bg-red-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                  Limpiar
                </motion.button>
              )}
              <select
                value={filterDifficulty}
                onChange={handleDifficultyChange}
                className="px-5 py-3 rounded-2xl font-semibold bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="all">Todas las Dificultades</option>
                <option value="facil">Fácil</option>
                <option value="medio">Medio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="text-center py-12 text-white">
              <ChefHat className="w-16 h-16 animate-bounce mx-auto mb-4" />
              <p className="text-lg">Cargando recetas... ¡El aroma ya llega!</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-red-200">
              <p className="text-lg">{error}</p>
            </div>
          )}

          {!loading && !error && filteredRecipes.length === 0 && (
            <div className="text-center py-12 text-white">
              <p className="text-lg">No se encontraron recetas. ¡Sé el primero en subir una!</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {!loading && !error && filteredRecipes.map(recipe => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl flex flex-col"
                >
                  {recipe.imageUrl && (
                    <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-40 object-cover rounded-2xl mb-4" />
                  )}
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{recipe.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">Por: {recipe.author}</p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center text-yellow-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${star <= (recipe.averageRating || 0) ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-800">
                      {(recipe.averageRating || 0).toFixed(1)}
                    </span>
                    <span className="text-gray-500 text-sm">({recipe.ratingCount || 0} votos)</span>
                  </div>

                  <p className="text-gray-700 text-sm mb-4 flex-grow">{recipe.description || 'Una deliciosa receta para disfrutar.'}</p>

                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-gray-500 text-xs">Tiempo: {recipe.totalTime || 'N/A'}</span>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      recipe.difficulty === 'facil' ? 'bg-green-100 text-green-800' :
                      recipe.difficulty === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {recipe.difficulty || 'N/A'}
                    </span>
                    <motion.button
                      onClick={() => handleOpenRecipeDetail(recipe)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChefHat className="w-4 h-4" />
                      Ver Receta
                    </motion.button>
                    {currentUser && currentUser.uid === recipe.authorId && (
                      <motion.button
                        onClick={() => handleEditRecipe(recipe)}
                        className="bg-orange-500 text-white px-3 py-2 rounded-xl flex items-center gap-2 font-semibold ml-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                    )}
                    {currentUser && (
                      <motion.button
                        onClick={() => handleToggleFavorite(recipe.id, profileData?.favoriteRecipes?.includes(recipe.id))}
                        className={`p-2 rounded-full ${location.state?.profileData?.favoriteRecipes?.includes(recipe.id) ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Heart className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {selectedRecipe && !isEditingRecipe && (
            <RecipeDetailModal
              isOpen={!!selectedRecipe}
              onClose={handleCloseRecipeDetail}
              recipeId={selectedRecipe?.id}
              onStartCooking={handleStartCooking}
            />
          )}
          {selectedRecipe && isEditingRecipe && (
            <RecipeEditModal
              isOpen={!!selectedRecipe && isEditingRecipe}
              onClose={handleCloseRecipeDetail}
              recipeToEdit={selectedRecipe}
              onSave={handleSaveRecipe}
            />
          )}
        </AnimatePresence>

        {/* Tutorial Modal */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md relative text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{tutorialStepsContent[tutorialStep].title}</h2>
                <p className="text-gray-700 mb-6">{tutorialStepsContent[tutorialStep].text}</p>
                <motion.button
                  onClick={nextTutorialStep}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tutorialStep < tutorialStepsContent.length - 1 ? 'Siguiente' : 'Entendido'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

export default RecipeLibrary;
