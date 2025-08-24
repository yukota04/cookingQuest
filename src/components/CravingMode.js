import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { ArrowLeft, Search, BookOpen, Utensils, XCircle } from 'lucide-react';
import NotificationModal from './NotificationModal';
import RecipeDetailModal from './RecipeDetailModal';

// Componente para mostrar una tarjeta de receta
const RecipeCard = ({ recipe, onSelect }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-4 shadow-lg flex flex-col cursor-pointer transform hover:scale-105 transition-transform duration-200"
      onClick={() => onSelect(recipe)}
    >
      <img src={recipe.imageUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Imagen+de+Receta'} alt={recipe.name} className="w-full h-32 object-cover rounded-xl mb-3" />
      <h3 className="text-lg font-bold text-gray-800">{recipe.name}</h3>
      <p className="text-sm text-gray-500 mb-2">Por: {recipe.author}</p>
      <div className="mt-auto text-center">
        <span className="inline-flex items-center gap-1 text-white bg-blue-500 font-semibold px-4 py-2 rounded-full">
          <BookOpen className="w-4 h-4" /> Ver
        </span>
      </div>
    </motion.div>
  );

const CravingMode = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'info' });
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    const db = getFirestore(app);

    const showNotification = (message, type) => {
        setNotification({ isOpen: true, message, type });
    };

    const closeNotification = () => {
        setNotification({ ...notification, isOpen: false });
    };
    
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            showNotification("Por favor, escribe lo que te provoca comer.", 'info');
            return;
        }

        setLoading(true);
        setSearchResults([]);
        
        try {
            // Firestore no soporta búsquedas de texto completas, pero podemos usar consultas
            // para buscar por un término que comience con lo que el usuario escribió.
            // Para una búsqueda más flexible, podríamos indexar con un servicio como Algolia.
            // Aquí, buscamos en los campos 'name' y 'description'.
            
            const nameQuery = query(collection(db, 'recipes'), where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
            const nameSnapshot = await getDocs(nameQuery);
            const nameResults = nameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const allResults = [...nameResults];
            setSearchResults(allResults);

            if (allResults.length === 0) {
                showNotification(`No se encontraron recetas para "${searchTerm}".`, 'info');
            }

        } catch (error) {
            console.error("Error searching for recipes:", error);
            showNotification("Error al buscar recetas. Inténtalo de nuevo.", 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const handleOpenRecipeDetail = (recipe) => {
        setSelectedRecipe(recipe);
        setIsDetailModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsDetailModalOpen(false);
        setSelectedRecipe(null);
    };

    const handleStartCooking = (recipe) => {
      if (recipe) {
        navigate('/real-cook-mode', { state: { recipe } });
      }
    };

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex flex-col items-center p-6 text-white">
                <motion.button
                    onClick={() => navigate('/cook-mode-hub')}
                    className="absolute top-4 left-4 flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-5 h-5" />
                    Modos
                </motion.button>
                
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 px-6 mt-16"
                >
                    <div className="flex items-center justify-center gap-4 text-white mb-4">
                        <Utensils className="w-12 h-12" />
                        <h1 className="text-4xl font-bold">¿Qué te provoca?</h1>
                    </div>
                    <p className="text-white/80 text-lg">
                        Escribe lo que te apetece y encuentra la receta perfecta.
                    </p>
                </motion.div>

                <div className="w-full max-w-lg mb-8">
                    <form onSubmit={handleSearch} className="relative flex items-center">
                        <input
                            type="text"
                            placeholder="Ej: Pizza, Sopa de Lentejas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-5 py-3 pl-12 rounded-2xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-gray-800"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <motion.button
                            type="submit"
                            className="absolute right-2 text-white bg-orange-500 px-4 py-2 rounded-xl font-semibold hover:bg-orange-600"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Buscar
                        </motion.button>
                    </form>
                </div>
                
                <AnimatePresence mode="wait">
                    {loading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-12 text-white"
                        >
                            <Utensils className="w-16 h-16 animate-bounce mx-auto mb-4" />
                            <p className="text-lg">Buscando recetas...</p>
                        </motion.div>
                    )}
                    
                    {!loading && searchResults.length > 0 && (
                        <motion.div 
                            key="results"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl"
                        >
                            {searchResults.map(recipe => (
                                <RecipeCard key={recipe.id} recipe={recipe} onSelect={handleOpenRecipeDetail} />
                            ))}
                        </motion.div>
                    )}

                    {!loading && searchResults.length === 0 && searchTerm.length > 0 && (
                        <motion.div
                            key="no-results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center bg-white/80 p-8 rounded-2xl"
                        >
                            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                            <p className="text-xl font-semibold text-gray-800">¡Vaya! No encontramos recetas.</p>
                            <p className="text-gray-600">Intenta buscar con otra palabra clave.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <NotificationModal
                isOpen={notification.isOpen}
                message={notification.message}
                onClose={closeNotification}
                type={notification.type}
            />
            {selectedRecipe && isDetailModalOpen && (
                <RecipeDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseModal}
                    recipeId={selectedRecipe.id}
                    onStartCooking={handleStartCooking}
                />
            )}
        </>
    );
};

export default CravingMode;