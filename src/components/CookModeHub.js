import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChefHat, Sparkles, Utensils, MessageSquare, Plus } from 'lucide-react';
import AdPlacement from './AdPlacement'; // Importa el nuevo componente de anuncio

const MEAL_TYPES = [
  { name: 'Desayuno', icon: '🍳', value: 'desayuno' },
  { name: 'Almuerzo', icon: '🍽️', value: 'almuerzo' },
  { name: 'Cena', icon: '🌙', value: 'cena' },
  { name: 'Postre', icon: '🍰', value: 'postre' },
  { name: 'Snack', icon: '🥨', value: 'snack' },
];

const CookModeHub = () => {
    const navigate = useNavigate();
    const [showAd, setShowAd] = useState(false);

    useEffect(() => {
        const adShown = sessionStorage.getItem('ad_shown_cook_mode');
        if (!adShown) {
            setShowAd(true);
            sessionStorage.setItem('ad_shown_cook_mode', 'true');
        }
    }, []);

    const menuItems = [
        {
            id: "what-i-have",
            title: "Tengo a la mano",
            subtitle: "Busca recetas con tus ingredientes",
            icon: Utensils,
            color: "from-green-500 to-teal-500",
            route: "/what-i-have",
        },
        {
            id: "surprise-me",
            title: "Sorpréndeme!",
            subtitle: "Elige un tipo de comida y te daré una receta al azar",
            icon: Sparkles,
            color: "from-purple-500 to-indigo-500",
            route: "/surprise-me",
        },
        {
            id: "craving",
            title: "Qué te provoca",
            subtitle: "Busca por tipo de comida",
            icon: MessageSquare,
            color: "from-orange-500 to-red-500",
            route: "/craving",
        },
    ];

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex flex-col items-center p-6 text-white">
                <motion.button
                    onClick={() => navigate('/menu')}
                    className="absolute top-4 left-4 flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-5 h-5" />
                    Menú Principal
                </motion.button>
                
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 px-6 mt-16"
                >
                    <h1 className="text-4xl font-bold text-white mb-2">Modo de Cocción</h1>
                    <p className="text-white/80 text-lg">
                        Elige cómo quieres empezar tu aventura culinaria.
                    </p>
                </motion.div>

                {showAd && <AdPlacement />}

                <div className="px-6 pb-8 w-full">
                    <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
                        {menuItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <motion.button
                                    key={item.id}
                                    onClick={() => navigate(item.route)}
                                    className={`relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-3xl p-6 text-left shadow-xl hover:shadow-2xl transition-all hover:scale-105`}
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -5 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex items-start gap-4">
                                        <motion.div
                                            className={`p-4 rounded-2xl bg-gradient-to-r ${item.color} shadow-lg`}
                                            whileHover={{ rotate: 5 }}
                                        >
                                            <Icon className="w-8 h-8 text-white" />
                                        </motion.div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-800 mb-1">
                                                {item.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm">{item.subtitle}</p>
                                        </div>
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl"></div>
                                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-lg"></div>
                                </motion.button>
                            );
                        })}
                        
                        <motion.button
                            onClick={() => navigate('/recipe-editor')}
                            className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-3xl p-6 text-left shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: menuItems.length * 0.1 }}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-start gap-4">
                                <motion.div
                                    className="p-4 rounded-2xl bg-gradient-to-r from-teal-500 to-green-500 shadow-lg"
                                    whileHover={{ rotate: 5 }}
                                >
                                    <Plus className="w-8 h-8 text-white" />
                                </motion.div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                                        Crear Nueva Receta
                                    </h3>
                                    <p className="text-gray-600 text-sm">Comparte tus propias creaciones</p>
                                </div>
                            </div>
                            <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl"></div>
                            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-lg"></div>
                        </motion.button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CookModeHub;