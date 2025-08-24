import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginScreen from "./components/LoginScreen";
import MainMenu from "./components/MainMenu";
import CookMode from "./components/CookMode";
import RecipeLibrary from "./components/RecipeLibrary";
import UserProfile from "./components/UserProfile";
import FeedScreen from "./components/FeedScreen";
import RealCookMode from "./components/RealCookMode";
import CookModeHub from "./components/CookModeHub";
import SurpriseMe from "./components/SurpriseMe";
import CravingMode from "./components/CravingMode";
import RecipeEditorScreen from "./components/RecipeEditorScreen";
import IntroScreen from "./components/IntroScreen";
import AchievementsScreen from "./components/AchievementsScreen"; // Importa el nuevo componente

// Wrapper para los componentes principales con un layout móvil
const MobileLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto">
        {children}
      </div>
    </div>
  );
};

// Componente placeholder para la pantalla de configuraciones
const SettingsScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-white">
        Configuración - Próximamente
      </h1>
    </div>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(
    sessionStorage.getItem('intro_seen') !== 'true'
  );

  useEffect(() => {
    // Flag para asegurar que la solicitud de permisos se haga solo una vez por sesión.
    const permissionsAsked = sessionStorage.getItem('permissions_asked');

    if (!permissionsAsked) {
      // Solicitar permiso de notificaciones
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          console.log("Permiso de notificaciones:", permission);
        });
      }

      // Solicitar permiso de la cámara
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          .then(stream => {
            // El stream ya no es necesario, lo detenemos para no consumir recursos
            stream.getTracks().forEach(track => track.stop());
            console.log("Permiso de cámara concedido.");
          })
          .catch(err => {
            console.log("Permiso de cámara denegado:", err);
          });
      }

      // Establecer el flag para no volver a pedir permisos en esta sesión
      sessionStorage.setItem('permissions_asked', 'true');
    }
  }, []);

  const handleIntroLoaded = () => {
    sessionStorage.setItem('intro_seen', 'true');
    setIsLoading(false);
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans">
        {isLoading ? (
          <IntroScreen onLoaded={handleIntroLoaded} />
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<MobileLayout><LoginScreen /></MobileLayout>} />
            <Route path="/menu" element={<MobileLayout><MainMenu /></MobileLayout>} />
            
            {/* Rutas de Recetas y Feed */}
            <Route path="/recipes" element={<MobileLayout><RecipeLibrary /></MobileLayout>} />
            <Route path="/feed" element={<MobileLayout><FeedScreen /></MobileLayout>} />
            <Route path="/profile" element={<MobileLayout><UserProfile /></MobileLayout>} />
            <Route path="/settings" element={<MobileLayout><SettingsScreen /></MobileLayout>} />
            <Route path="/achievements" element={<MobileLayout><AchievementsScreen /></MobileLayout>} />
            
            {/* Rutas de los Nuevos Modos de Cocción */}
            <Route path="/cook-mode-hub" element={<MobileLayout><CookModeHub /></MobileLayout>} />
            <Route path="/what-i-have" element={<MobileLayout><CookMode /></MobileLayout>} />
            <Route path="/surprise-me" element={<MobileLayout><SurpriseMe /></MobileLayout>} />
            <Route path="/craving" element={<MobileLayout><CravingMode /></MobileLayout>} />
            
            {/* Ruta de Cocción Activa y Editor de Recetas */}
            <Route path="/real-cook-mode" element={<MobileLayout><RealCookMode /></MobileLayout>} />
            <Route path="/recipe-editor" element={<MobileLayout><RecipeEditorScreen /></MobileLayout>} />
          </Routes>
        )}
      </div>
    </Router>
  );
};

export default App;