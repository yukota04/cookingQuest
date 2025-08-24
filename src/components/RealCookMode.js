import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Play, Pause, FastForward, Rewind, ChefHat, CheckCircle, XCircle, Utensils } from 'lucide-react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import NotificationModal from './NotificationModal';

const RealCookMode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const recipeData = location.state?.recipe;

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    const db = getFirestore(app);

    const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'info' });

    const showNotification = (message, type) => {
        setNotification({ isOpen: true, message, type });
    };

    const closeNotification = () => {
        setNotification({ ...notification, isOpen: false });
    };

    useEffect(() => {
        const fetchRecipe = async () => {
            if (!recipeData?.id) {
                setError("No se encontró una receta para cocinar.");
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(db, 'recipes', recipeData.id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRecipe({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError("Receta no encontrada.");
                }
            } catch (err) {
                console.error("Error fetching recipe:", err);
                setError("Error al cargar la receta. Inténtalo de nuevo.");
            } finally {
                setLoading(false);
            }
        };

        if (recipeData) {
            fetchRecipe();
        } else {
            setError("No se encontró una receta para cocinar.");
            setLoading(false);
        }
    }, [recipeData, db]);


    useEffect(() => {
        if (isRunning) {
            const interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isRunning]);

    const handleNextStep = () => {
        if (recipe && currentStepIndex < recipe.steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
            setTimer(0);
            setIsRunning(false);
        }
    };

    const handlePreviousStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
            setTimer(0);
            setIsRunning(false);
        }
    };

    const handleTimerToggle = () => {
        setIsRunning(!isRunning);
    };

    const handleTimerReset = () => {
        setTimer(0);
        setIsRunning(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-400 via-teal-400 to-blue-500 flex items-center justify-center p-6">
                <div className="text-center text-white">
                    <ChefHat className="w-20 h-20 animate-bounce mx-auto mb-4" />
                    <p className="text-xl">Preparando la cocina...</p>
                </div>
            </div>
        );
    }

    if (error || !recipe) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-400 via-teal-400 to-blue-500 flex items-center justify-center p-6 text-center text-white">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
                    <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                    <p className="text-xl font-semibold text-gray-800 mb-4">{error || "No se encontró la receta."}</p>
                    <motion.button 
                        onClick={() => navigate('/cook-mode-hub')}
                        className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Volver a Modos de Cocción
                    </motion.button>
                </div>
            </div>
        );
    }
    
    const currentStep = recipe.steps[currentStepIndex];

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-green-400 via-teal-400 to-blue-500 flex flex-col items-center p-6 text-white">
                <motion.button
                    onClick={() => navigate('/cook-mode-hub')}
                    className="absolute top-4 left-4 flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-5 h-5" />
                    Salir
                </motion.button>
                
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-2xl mt-16 bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl flex flex-col"
                >
                    {/* Header de la receta */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-3 rounded-full shadow-lg">
                            <ChefHat className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{recipe.name}</h1>
                            <p className="text-gray-600">Paso {currentStepIndex + 1} de {recipe.steps.length}</p>
                        </div>
                    </div>

                    {/* Contenido del paso actual */}
                    <div className="text-center mb-6">
                        {currentStep.image && (
                            <img 
                                src={currentStep.image} 
                                alt={`Paso ${currentStepIndex + 1}`} 
                                className="w-full h-64 object-cover rounded-2xl mb-4"
                            />
                        )}
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {currentStep.type ? `${currentStep.type}` : `Paso ${currentStepIndex + 1}`}
                        </h3>
                        <p className="text-gray-700 text-lg mb-4">{currentStep.instruction}</p>
                        
                        {/* Información adicional del paso */}
                        {(currentStep.time || currentStep.utensil) && (
                            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 font-semibold">
                                {currentStep.time && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> {currentStep.time}
                                    </span>
                                )}
                                {currentStep.utensil && (
                                    <span className="flex items-center gap-1">
                                        <Utensils className="w-4 h-4" /> {currentStep.utensil}
                                    </span>
                                )}
                                {currentStep.temperature && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> {currentStep.temperature}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Controles de navegación */}
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-200">
                        <motion.button
                            onClick={handlePreviousStep}
                            disabled={currentStepIndex === 0}
                            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-semibold disabled:opacity-50"
                            whileHover={currentStepIndex > 0 ? { scale: 1.05 } : {}}
                            whileTap={currentStepIndex > 0 ? { scale: 0.95 } : {}}
                        >
                            <Rewind className="w-6 h-6" />
                        </motion.button>
                        
                        {/* Botón de Temporizador */}
                        {currentStep.time && (
                          <motion.button
                              onClick={handleTimerToggle}
                              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg ${isRunning ? 'bg-red-500' : 'bg-orange-500'} text-white`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                          >
                              {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                              <span className="tabular-nums">
                                  {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
                              </span>
                          </motion.button>
                        )}

                        <motion.button
                            onClick={handleNextStep}
                            disabled={currentStepIndex === (recipe?.steps?.length - 1)}
                            className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold disabled:opacity-50"
                            whileHover={currentStepIndex < (recipe?.steps?.length - 1) ? { scale: 1.05 } : {}}
                            whileTap={currentStepIndex < (recipe?.steps?.length - 1) ? { scale: 0.95 } : {}}
                        >
                            <FastForward className="w-6 h-6" />
                        </motion.button>
                    </div>
                </motion.div>
            </div>
            <NotificationModal
                isOpen={notification.isOpen}
                message={notification.message}
                onClose={closeNotification}
                type={notification.type}
            />
        </>
    );
};

export default RealCookMode;