import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { ArrowLeft, ChefHat, Search, Sparkles, XCircle } from 'lucide-react';

// Componente para mostrar una tarjeta de receta (puedes reutilizar el de RecipeLibrary o usar este)
const RecipeCard = ({ recipe, onSelect }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.5 }}
    transition={{ duration: 0.3 }}
    className="bg-white rounded-2xl p-4 shadow-lg flex flex-col cursor-pointer"
    onClick={() => onSelect(recipe)}
  >
    <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-32 object-cover rounded-xl mb-3" />
    <h3 className="text-lg font-bold text-gray-800">{recipe.name}</h3>
    <p className="text-sm text-gray-500 mb-2">Por: {recipe.author}</p>
    <div className="mt-auto text-center">
        <span className="text-white bg-green-500 font-semibold px-4 py-2 rounded-lg">
            Cocinar
        </span>
    </div>
  </motion.div>
);


const CookMode = () => {
    const navigate = useNavigate();
    const [allRecipes, setAllRecipes] = useState([]);
    const [uniqueIngredients, setUniqueIngredients] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState(new Set());
    const [foundRecipes, setFoundRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);

    const db = getFirestore(app);

    // Cargar todas las recetas e ingredientes al iniciar
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const recipesCollection = collection(db, 'recipes');
            const querySnapshot = await getDocs(recipesCollection);
            const fetchedRecipes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllRecipes(fetchedRecipes);

            // Extraer todos los ingredientes y crear una lista única y ordenada
            const ingredientsSet = new Set();
            fetchedRecipes.forEach(recipe => {
                recipe.ingredients.forEach(ing => {
                    // Normalizamos el nombre del ingrediente para evitar duplicados (ej: "Tomate" y "tomate")
                    ingredientsSet.add(ing.name.trim().toLowerCase());
                });
            });
            const sortedIngredients = Array.from(ingredientsSet).sort();
            setUniqueIngredients(sortedIngredients);
            setLoading(false);
        };
        fetchData();
    }, [db]);

    // Manejar la selección/deselección de un ingrediente
    const handleToggleIngredient = (ingredientName) => {
        const newSelection = new Set(selectedIngredients);
        if (newSelection.has(ingredientName)) {
            newSelection.delete(ingredientName);
        } else {
            newSelection.add(ingredientName);
        }
        setSelectedIngredients(newSelection);
    };

    // Lógica para buscar recetas que coincidan
    const handleSearchRecipes = () => {
        if (selectedIngredients.size === 0) {
            alert("¡Selecciona al menos un ingrediente!");
            return;
        }

        const results = allRecipes.filter(recipe => {
            // La receta es válida si CADA UNO de sus ingredientes está en la lista de seleccionados
            return recipe.ingredients.every(ing =>
                selectedIngredients.has(ing.name.trim().toLowerCase())
            );
        });

        setFoundRecipes(results);
        setHasSearched(true);
    };
    
    // Reiniciar la búsqueda para seleccionar ingredientes de nuevo
    const handleResetSearch = () => {
        setSelectedIngredients(new Set());
        setFoundRecipes([]);
        setHasSearched(false);
    };
    
    // Navegar a la pantalla de cocina
    const handleStartCooking = (recipe) => {
        navigate('/ingredient-verification', { state: { recipe } });
    };


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

            <div className="max-w-4xl mx-auto mt-16">
                <AnimatePresence mode="wait">
                    {!hasSearched ? (
                        // --- VISTA DE SELECCIÓN DE INGREDIENTES ---
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <h1 className="text-4xl font-bold text-white text-center mb-2">¿Qué tienes en tu nevera?</h1>
                            <p className="text-white/80 text-center mb-6">Selecciona los ingredientes que tienes y te diremos qué puedes cocinar.</p>
                            
                            {loading ? (
                                <p className="text-white text-center">Cargando ingredientes...</p>
                            ) : (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {uniqueIngredients.map(ing => (
                                        <motion.button
                                            key={ing}
                                            onClick={() => handleToggleIngredient(ing)}
                                            className={`p-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                                selectedIngredients.has(ing)
                                                    ? 'bg-green-500 text-white shadow-md'
                                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                                            }`}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            {ing.charAt(0).toUpperCase() + ing.slice(1)}
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            <motion.button
                                onClick={handleSearchRecipes}
                                disabled={loading || selectedIngredients.size === 0}
                                className="w-full mt-6 py-4 rounded-2xl bg-green-600 text-white font-bold text-lg flex items-center justify-center gap-2 disabled:bg-gray-400"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Search className="w-6 h-6" />
                                Buscar Recetas ({selectedIngredients.size})
                            </motion.button>
                        </motion.div>
                    ) : (
                        // --- VISTA DE RESULTADOS ---
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                             <h1 className="text-4xl font-bold text-white text-center mb-2">¡Manos a la obra!</h1>
                             <p className="text-white/80 text-center mb-6">Encontramos {foundRecipes.length} receta(s) que puedes preparar.</p>

                             {foundRecipes.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {foundRecipes.map(recipe => (
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
