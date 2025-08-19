import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  Check,
  Clock,
  Flame,
  ChefHat,
  Play,
  Pause,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CookMode = ({ recipe }) => {
  // Now accepts recipe as prop
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Use the recipe passed as prop
  const currentStepData = recipe.steps[currentStep];

  useEffect(() => {
    // Reset state when recipe changes
    setCurrentStep(0);
    setIsTimerRunning(false);
    setTimeRemaining(0);
  }, [recipe]);

  const handleNextStep = () => {
    if (currentStep < recipe.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setTimeRemaining(recipe.steps[currentStep + 1].duration * 60);
      setIsTimerRunning(false);
    }
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setTimeRemaining(currentStepData.duration * 60);
  };

  const getFlameColor = (level) => {
    switch (level) {
      case "bajo":
        return "text-blue-500";
      case "medio":
        return "text-orange-500";
      case "alto":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => time - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-teal-400 to-blue-500">
      {/* Header */}
      <div className="bg-white/20 backdrop-blur-md p-4 flex items-center justify-between">
        <motion.button
          onClick={() => navigate("/recipes")}
          className="flex items-center gap-2 text-white font-semibold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Recetas
        </motion.button>

        <div className="text-center">
          <h1 className="text-xl font-bold text-white">{recipe.name}</h1>
          <p className="text-white/80 text-sm">
            Paso {currentStep + 1} de {recipe.steps.length}
          </p>
        </div>

        <div className="flex items-center gap-2 text-white">
          <Clock className="w-5 h-5" />
          <span className="font-semibold">{recipe.totalTime}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/10 backdrop-blur-md p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-white h-full rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep + 1) / recipe.steps.length) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Instruction */}
          <div className="lg:col-span-2">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl mb-6"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-full p-3">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Paso {currentStep + 1}
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {currentStepData.instruction}
                  </p>
                </div>
              </div>

              {/* Step Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Ingrediente
                  </h3>
                  <p className="text-sm text-gray-600">
                    {currentStepData.ingredient}
                  </p>
                </div>

                <div className="bg-orange-50 rounded-2xl p-4 text-center">
                  <Flame
                    className={`w-8 h-8 mx-auto mb-2 ${getFlameColor(currentStepData.flameLevel)}`}
                  />
                  <h3 className="font-semibold text-gray-800 mb-1">Fuego</h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {currentStepData.flameLevel}
                  </p>
                </div>

                <div className="bg-green-50 rounded-2xl p-4 text-center">
                  <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Tiempo</h3>
                  <p className="text-sm text-gray-600">
                    {currentStepData.duration} min
                  </p>
                </div>
              </div>

              {/* Timer */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-4">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="flex justify-center gap-4">
                    <motion.button
                      onClick={startTimer}
                      disabled={isTimerRunning}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold ${
                        isTimerRunning
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                      whileHover={!isTimerRunning ? { scale: 1.05 } : {}}
                      whileTap={!isTimerRunning ? { scale: 0.95 } : {}}
                    >
                      <Play className="w-5 h-5" />
                      Iniciar Timer
                    </motion.button>

                    <motion.button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isTimerRunning ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                      {isTimerRunning ? "Pausar" : "Reanudar"}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-2xl p-4 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  💡 Consejo del Chef
                </h3>
                <p className="text-yellow-700">{currentStepData.tips}</p>
              </div>

              {/* Next Step Button */}
              <motion.button
                onClick={handleNextStep}
                disabled={currentStep >= recipe.steps.length - 1}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg ${
                  currentStep >= recipe.steps.length - 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600"
                }`}
                whileHover={
                  currentStep < recipe.steps.length - 1 ? { scale: 1.02 } : {}
                }
                whileTap={
                  currentStep < recipe.steps.length - 1 ? { scale: 0.98 } : {}
                }
              >
                <Check className="w-6 h-6" />
                {currentStep >= recipe.steps.length - 1
                  ? "¡Receta Completada!"
                  : "Listo - Siguiente Paso"}
              </motion.button>
            </motion.div>
          </div>

          {/* Chat Assistant */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl sticky top-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Asistente Chef
                </h3>
              </div>

              <div className="bg-gray-100 rounded-2xl p-4 h-64 overflow-y-auto mb-4">
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-700">
                      👋 ¡Hola! Soy tu asistente personal de cocina. Te guiaré
                      paso a paso.
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      🔥 Recuerda mantener el fuego en nivel{" "}
                      <strong>{currentStepData.flameLevel}</strong> para este
                      paso.
                    </p>
                  </div>

                  {timeRemaining > 0 && isTimerRunning && (
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-sm text-orange-700">
                        ⏳ Tiempo restante:{" "}
                        <strong>{formatTime(timeRemaining)}</strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pregúntame algo..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                />
                <motion.button
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Enviar
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookMode;
