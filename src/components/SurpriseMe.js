import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { ArrowLeft, Sparkles, ChefHat, BookOpen } from 'lucide-react';
import NotificationModal from './NotificationModal';
import RecipeDetailModal from './RecipeDetailModal';

const MEAL_TYPES = [
    { name: 'Desayuno', icon: '🍳' },
    { name: 'Almuerzo', icon: '🍽️' },
    { name: 'Cena', icon: '🌙' },
    { name: 'Postre', icon: '🍰' },
    { name: 'Snack', icon: '🥨' },
];

const SurpriseMe = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [randomRecipe, setRandomRecipe] = useState(null);
    const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'info' });
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const db = getFirestore(app);

    const showNotification = (message, type) => {
        setNotification({ isOpen: true, message, type });
    };

    const closeNotification = () => {
        setNotification({ ...notification, isOpen: false });
    };

    const fetchRandomRecipe = async (mealType) => {
        setLoading(true);
        setRandomRecipe(null);
        try {
            const q = query(collection(db, 'recipes'), where('mealType', '==', mealType));
            const querySnapshot = await getDocs(q);
            const recipes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (recipes.length > 0) {
                const randomIndex = Math.floor(Math.random() * recipes.length);
                setRandomRecipe(recipes[randomIndex]);
            } else {
                showNotification(`No se encontraron recetas para ${mealType}.`, 'info');
            }
        } catch (error) {
            console.error("Error fetching random recipe:", error);
            showNotification("Error al buscar una receta. Inténtalo de nuevo.", 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const handleStartCooking = () => {
      if (randomRecipe) {
        navigate('/real-cook-mode', { state: { recipe: randomRecipe } });
      }
    };

    const handleViewRecipeDetail = () => {
        setIsDetailModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsDetailModalOpen(false);
    };

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 flex flex-col items-center p-6 text-white">
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
                        <Sparkles className="w-12 h-12" />
                        <h1 className="text-4xl font-bold">¡Sorpréndeme!</h1>
                    </div>
                    <p className="text-white/80 text-lg">
                        Elige un tipo de comida y te daré una receta al azar para cocinar.
                    </p>
                </motion.div>

                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 w-full max-w-lg mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Tipo de Comida</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {MEAL_TYPES.map(meal => (
                            <motion.button
                                key={meal.name}
                                onClick={() => fetchRandomRecipe(meal.name)}
                                className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="text-2xl">{meal.icon}</span>
                                <span>{meal.name}</span>
                            </motion.button>
                        ))}
                    </div>
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
                            <ChefHat className="w-16 h-16 animate-bounce mx-auto mb-4" />
                            <p className="text-lg">Buscando una sorpresa para ti...</p>
                        </motion.div>
                    )}
                    
                    {randomRecipe && (
                        <motion.div 
                            key="result"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl w-full max-w-lg"
                        >
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Tu receta sorpresa es!</h2>
                            <img src={randomRecipe.imageUrl} alt={randomRecipe.name} className="w-full h-48 object-cover rounded-2xl mb-4" />
                            <h3 className="text-xl font-bold text-gray-800">{randomRecipe.name}</h3>
                            <p className="text-gray-600 text-sm mb-3">Por: {randomRecipe.author}</p>
                            <p className="text-gray-700 text-sm mb-4">{randomRecipe.description}</p>
                            
                            <div className="flex items-center justify-between mt-auto">
                                <motion.button
                                    onClick={handleViewRecipeDetail}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Ver Receta
                                </motion.button>
                                <motion.button
                                    onClick={() => fetchRandomRecipe(randomRecipe.mealType)}
                                    className="bg-purple-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Otra sorpresa
                                </motion.button>
                            </div>
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
            {randomRecipe && isDetailModalOpen && (
                <RecipeDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseModal}
                    recipeId={randomRecipe.id}
                    onStartCooking={handleStartCooking}
                />
            )}
        </>
    );
};

export default SurpriseMe;
