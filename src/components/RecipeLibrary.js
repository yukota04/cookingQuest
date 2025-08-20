import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  ChefHat,
  Search,
  BookOpen,
  Plus,
  Star,
  X,
  Star as StarIcon,
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
  updateDoc,
} from 'firebase/firestore';
import { app } from '../firebaseConfig';
import AddRecipeModal from './AddRecipeModal';
import RecipeDetailModal from './RecipeDetailModal';
import IngredientVerificationScreen from './IngredientVerificationScreen';
import RecipeEditModal from './RecipeEditModal';

const AdComponent = ({ onClose }) => {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Simula la carga de un anuncio de video de 5 segundos
    const timer = setTimeout(() => {
      setAdLoaded(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
    >
      <div className="bg-white rounded-3xl p-6 relative w-full max-w-lg">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Anuncio de video</h2>
        <div className="w-full h-64 bg-gray-300 flex items-center justify-center rounded-2xl mb-4">
          <span className="text-gray-500">{adLoaded ? 'Video de publicidad' : 'Cargando anuncio...'}</span>
        </div>
        <p className="text-sm text-gray-600 text-center">¡El contenido de la aplicación aparecerá en 5 segundos!</p>
      </div>
    </motion.div>
  );
};

const RecipeLibrary = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const [userFavorites, setUserFavorites] = useState([]);
  const [showAd, setShowAd] = useState(true);

  useEffect(() => {
    // Cierra el anuncio después de 5 segundos
    const adTimer = setTimeout(() => {
      setShowAd(false);
    }, 5000);
    return () => clearTimeout(adTimer);
  }, []);
  
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      setError(null);
      try {
        let recipesQuery = collection(db, 'recipes');
        if (filterDifficulty !== 'all') {
          recipesQuery = query(recipesQuery, where('difficulty', '==', filterDifficulty));
        }
        if (searchTerm) {
          const nameQuery = query(recipesQuery, where('name', '==', searchTerm));
          const nameSnapshot = await getDocs(nameQuery);
          const nameResults = nameSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          const authorQuery = query(recipesQuery, where('author', '==', searchTerm));
          const authorSnapshot = await getDocs(authorQuery);
          const authorResults = authorSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          const combinedResults = [...nameResults, ...authorResults];
          setRecipes(combinedResults);
        } else {
          const snapshot = await getDocs(recipesQuery);
          const fetchedRecipes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setRecipes(fetchedRecipes);
        }
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setError('No se pudieron cargar las recetas. Inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, [searchTerm, filterDifficulty, db]);
  
  const handleRecipeClick = (recipe) => {
    setSelectedRecipe(recipe);
  };
  
  const handleStartCookMode = (recipe) => {
    setShowIngredients(true);
    setSelectedRecipe(recipe);
  };
  
  const handleVerifyIngredients = (recipe) => {
    navigate('/cook-mode', { state: { recipe } });
  };
  
  const handleEditRecipe = (recipe) => {
    setEditRecipe(recipe);
  };

  const handleCloseEditModal = () => {
    setEditRecipe(null);
  };

  const handleFavorite = async (recipeId, isFavorited) => {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) {
      alert('Debes iniciar sesión para marcar recetas como favoritas.');
      return;
    }

    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, {
        favoriteRecipes: isFavorited ? arrayRemove(recipeId) : arrayUnion(recipeId),
      });
      alert(isFavorited ? 'Receta eliminada de favoritos.' : 'Receta añadida a favoritos.');
    } catch (e) {
      console.error('Error updating favorite status:', e);
      alert('Error al actualizar favoritos.');
    }
  };
  
  const handleSearch = () => {
    // La búsqueda se realiza automáticamente con cada cambio en el término de búsqueda
  };
  
  const filteredRecipes = recipes.filter((recipe) =>
    filterDifficulty === 'all' || recipe.difficulty === filterDifficulty
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 p-6">
      <AnimatePresence>
        {showAd && <AdComponent onClose={() => setShowAd(false)} />}
      </AnimatePresence>
      <div className="flex items-center justify-between mb-6">
        <motion.button onClick={() => navigate('/menu')} className="text-white font-semibold flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <ArrowLeft className="w-5 h-5" />
          Atrás
        </motion.button>
        <motion.button onClick={() => setShowAddModal(true)} className="bg-white text-orange-500 p-3 rounded-full shadow-lg" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Plus size={24} />
        </motion.button>
      </div>

      <h1 className="text-4xl font-bold text-white mb-2">Biblioteca de Recetas</h1>
      <p className="text-white/80 text-lg mb-6">Encuentra tu próxima aventura culinaria.</p>

      <div className="relative mb-6">
        <input type="text" placeholder="Buscar por nombre o autor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500" />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      <div className="flex justify-around mb-6">
        <motion.button onClick={() => setFilterDifficulty('all')} className={`py-2 px-4 rounded-full font-semibold transition-colors ${filterDifficulty === 'all' ? 'bg-orange-500 text-white' : 'bg-white/30 text-white'}`}>
          Todas
        </motion.button>
        <motion.button onClick={() => setFilterDifficulty('facil')} className={`py-2 px-4 rounded-full font-semibold transition-colors ${filterDifficulty === 'facil' ? 'bg-orange-500 text-white' : 'bg-white/30 text-white'}`}>
          Fácil
        </motion.button>
        <motion.button onClick={() => setFilterDifficulty('medio')} className={`py-2 px-4 rounded-full font-semibold transition-colors ${filterDifficulty === 'medio' ? 'bg-orange-500 text-white' : 'bg-white/30 text-white'}`}>
          Medio
        </motion.button>
        <motion.button onClick={() => setFilterDifficulty('dificil')} className={`py-2 px-4 rounded-full font-semibold transition-colors ${filterDifficulty === 'dificil' ? 'bg-orange-500 text-white' : 'bg-white/30 text-white'}`}>
          Difícil
        </motion.button>
      </div>

      {loading ? (
        <div className="text-center text-white text-lg mt-10">Cargando recetas...</div>
      ) : error ? (
        <div className="text-center text-red-300 text-lg mt-10">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <motion.div key={recipe.id} className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-40 object-cover rounded-2xl mb-4" />
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{recipe.name}</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <StarIcon className="w-5 h-5 fill-current" />
                    <span className="font-semibold">{recipe.averageRating ? recipe.averageRating.toFixed(1) : 'N/A'}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{recipe.totalTime}</p>
                <div className="flex justify-between items-center">
                  <span className={`py-1 px-3 rounded-full text-xs font-semibold ${recipe.difficulty === 'facil' ? 'bg-green-200 text-green-800' : recipe.difficulty === 'medio' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>
                    {recipe.difficulty}
                  </span>
                  <div className="flex gap-2">
                    <motion.button onClick={() => handleFavorite(recipe.id, userFavorites.includes(recipe.id))} className="text-red-500" whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                      <Heart className={`w-6 h-6 ${userFavorites.includes(recipe.id) ? 'fill-current' : ''}`} />
                    </motion.button>
                    <motion.button onClick={() => handleRecipeClick(recipe)} className="bg-orange-500 text-white py-2 px-4 rounded-full font-semibold" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      Ver
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center text-white/70 text-lg mt-10 col-span-full">
              No se encontraron recetas.
            </div>
          )}
        </div>
      )}
      <AnimatePresence>
        {selectedRecipe && <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} onStartCookMode={handleStartCookMode} />}
        {showAddModal && <AddRecipeModal onClose={() => setShowAddModal(false)} />}
        {showIngredients && <IngredientVerificationScreen recipe={selectedRecipe} onClose={() => setShowIngredients(false)} onVerifyIngredients={handleVerifyIngredients} />}
        {editRecipe && <RecipeEditModal recipe={editRecipe} onClose={handleCloseEditModal} />}
      </AnimatePresence>
    </div>
  );
};

export default RecipeLibrary;
