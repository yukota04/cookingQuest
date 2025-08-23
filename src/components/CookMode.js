import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { ArrowLeft, ChefHat, Search, Sparkles, XCircle, Filter } from 'lucide-react';
import IngredientVerificationScreen from './IngredientVerificationScreen';

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
      <span className="inline-flex items-center gap-1 text-white bg-green-500 font-semibold px-4 py-2 rounded-full">
        <ChefHat className="w-4 h-4" /> Cocinar
      </span>
    </div>
  </motion.div>
);

const CookMode = () => {
    const navigate = useNavigate();
    const [allRecipes, setAllRecipes] = useState([]);
    const [uniqueIngredients, setUniqueIngredients] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState(new Set());
    const [filteredRecipes, setFilteredRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [currentCookingRecipe, setCurrentCookingRecipe] = useState(null);

    const db = getFirestore(app);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const recipesCollection = collection(db, 'recipes');
                const querySnapshot = await getDocs(recipesCollection);
                const fetchedRecipes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllRecipes(fetchedRecipes);

                const ingredientsMap = new Map();
                fetchedRecipes.forEach(recipe => {
                    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                        recipe.ingredients.forEach(ing => {
                            const normalizedName = (ing.name || '').trim().toLowerCase();
                            if (normalizedName && !ingredientsMap.has(normalizedName)) {
                                ingredientsMap.set(normalizedName, {
                                    name: ing.name,
                                    image: ing.image || 'https://placehold.co/100x100/FBCB6A/333333?text=?'
                                });
                            }
                        });
                    }
                });
                const sortedIngredients = Array.from(ingredientsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
                setUniqueIngredients(sortedIngredients);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [db]);

    const handleSearchRecipes = () => {
        if (selectedIngredients.size === 0) {
            showModal("¡Selecciona al menos un ingrediente!");
            return;
        }

        const results = allRecipes.filter(recipe => {
            if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) return false;
            return [...selectedIngredients].every(selectedIngName =>
                recipe.ingredients.some(recipeIng => 
                    (recipeIng.name || '').trim().toLowerCase() === selectedIngName
                )
            );
        });

        setFilteredRecipes(results);
        setIsSearching(true);
    };

    const handleToggleIngredient = (ingredientName) => {
        const newSelection = new Set(selectedIngredients);
        const normalizedName = ingredientName.trim().toLowerCase();

        if (newSelection.has(normalizedName)) {
            newSelection.delete(normalizedName);
        } else {
            newSelection.add(normalizedName);
        }
        setSelectedIngredients(newSelection);
    };

    const handleResetSearch = () => {
        setSelectedIngredients(new Set());
        setFilteredRecipes([]);
        setIsSearching(false);
    };
    
    const handleStartCooking = (recipe) => {
        setCurrentCookingRecipe(recipe);
    };

    const handleStartCookingRealMode = () => {
        navigate('/cook-mode', { state: { recipe: currentCookingRecipe } });
    };

    const handleCloseVerification = () => {
      setCurrentCookingRecipe(null);
    };

    const [modalMessage, setModalMessage] = useState(null);
    const showModal = (message) => {
        setModalMessage(message);
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
        <div className="min-h-screen bg-gradient-to-br from-orange-300 via-red-400 to-pink-500 p-4 sm:p-6">
            <motion.button
                onClick={() => navigate('/menu')}
                className="absolute top-4 left-4 flex items-center gap-2 text-white font-semibold bg-black/20 px-4 py-2 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <ArrowLeft className="w-5 h-5" />
                Menú Principal
            </motion.button>

            <AnimatePresence>
                {modalMessage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm relative text-center">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Aviso</h2>
                            <p className="text-gray-700 mb-6">{modalMessage}</p>
                            <motion.button
                                onClick={() => setModalMessage(null)}
                                className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Entendido
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto mt-16">
                <AnimatePresence mode="wait">
                    {!isSearching ? (
                        <motion.div key="selection" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            <h1 className="text-4xl font-bold text-white text-center mb-2">¿Qué tienes en tu nevera?</h1>
                            <p className="text-white/80 text-center mb-6">Selecciona los ingredientes que tienes y te diremos qué puedes cocinar.</p>
                            
                            {loading ? (
                                <div className="text-center py-12 text-white">
                                    <ChefHat className="w-16 h-16 animate-bounce mx-auto mb-4" />
                                    <p className="text-lg">Cargando ingredientes...</p>
                                </div>
                            ) : (
                                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
                                    {uniqueIngredients.map(ing => (
                                        <motion.div
                                            key={ing.name}
                                            onClick={() => handleToggleIngredient(ing.name)}
                                            className={`p-2 rounded-lg text-center font-semibold transition-all duration-200 cursor-pointer ${
                                                selectedIngredients.has(ing.name.toLowerCase())
                                                    ? 'bg-green-500 text-white shadow-lg ring-2 ring-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                                            }`}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <img src={ing.image} alt={ing.name} className="w-full h-16 object-cover rounded-md mb-2"/>
                                            <span className="text-xs">{ing.name}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            <motion.button
                                onClick={handleSearchRecipes}
                                disabled={loading || selectedIngredients.size === 0}
                                className="w-full mt-6 py-4 rounded-2xl bg-green-600 text-white font-bold text-lg flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                whileHover={!loading && selectedIngredients.size > 0 ? { scale: 1.02 } : {}}
                                whileTap={!loading && selectedIngredients.size > 0 ? { scale: 0.98 } : {}}
                            >
                                <Search className="w-6 h-6" />
                                Buscar Recetas ({selectedIngredients.size})
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                             <h1 className="text-4xl font-bold text-white text-center mb-2">¡Manos a la obra!</h1>
                             <p className="text-white/80 text-center mb-6">Encontramos {filteredRecipes.length} receta(s) que puedes preparar.</p>

                             {filteredRecipes.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredRecipes.map(recipe => (
                                        <RecipeCard key={recipe.id} recipe={recipe} onSelect={handleStartCooking} />
                                    ))}
                                </div>
                             ) : (
                                <div className="text-center bg-white/80 p-8 rounded-2xl">
                                    <Sparkles className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                                    <p className="text-xl font-semibold text-gray-800">¡Vaya! No encontramos recetas exactas.</p>
                                    <p className="text-gray-600">Intenta agregar más ingredientes a tu selección.</p>
                                </div>
                             )}

                            <motion.button
                                onClick={handleResetSearch}
                                className="w-full mt-6 py-3 rounded-2xl bg-white/50 text-white font-bold flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <XCircle className="w-5 h-5" />
                                Volver a buscar
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CookMode;