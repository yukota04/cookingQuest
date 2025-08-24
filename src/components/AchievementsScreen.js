import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Lock, Unlock, CheckCircle, Plus, X } from 'lucide-react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebaseConfig';

const ACHIEVEMENTS_DATA = {
  // Logros por Creación de Recetas
  recipesCreated: [
    { id: 'first_recipe', name: 'Primeros pasos', threshold: 1, description: 'Crea tu primera receta y comienza tu viaje culinario.' },
    { id: 'apprentice_chef', name: 'El aprendiz de cocina', threshold: 5, description: 'Crea 5 recetas para demostrar tus habilidades.' },
    { id: 'rising_master', name: 'Maestro en ascenso', threshold: 10, description: 'Publica 10 recetas y comparte tu pasión.' },
    { id: 'prolific_chef', name: 'El chef prolífico', threshold: 20, description: 'Alcanza la marca de 20 recetas creadas.' },
    { id: 'golden_chef', name: 'El Chef de oro', threshold: 50, description: 'Felicidades, has creado 50 recetas.' },
    { id: 'culinary_legend', name: 'Leyenda culinaria', threshold: 100, description: 'Una leyenda no se detiene, 100 recetas creadas.' },
  ],
  // Logros por Calificación de Recetas
  recipesRated: [
    { id: 'taste_approved', name: 'Sabor aprobado', threshold: 3, description: 'Una de tus recetas ha alcanzado 3 estrellas.', check: 'recipesWithStarRating.3_stars' },
    { id: 'path_to_perfection', name: 'En el camino a la perfección', threshold: 4, description: 'Una de tus recetas ha alcanzado 4 estrellas.', check: 'recipesWithStarRating.4_stars' },
    { id: 'culinary_masterpiece', name: 'Obra maestra culinaria', threshold: 5, description: 'Tu receta ha alcanzado 5 estrellas. ¡Impresionante!', check: 'recipesWithStarRating.5_stars' },
  ],
  // Logros por Favoritos
  favorites: [
    { id: 'initial_popularity', name: 'Popularidad inicial', threshold: 5, description: 'Una de tus recetas ha sido añadida a 5 favoritos.' },
    { id: 'special_touch', name: 'El toque especial', threshold: 10, description: '10 usuarios han guardado una de tus recetas.' },
    { id: 'cookbook_star', name: 'La estrella del recetario', threshold: 20, description: 'Alcanza 20 favoritos en tus recetas.' },
    { id: 'favorite_chef', name: 'El chef favorito de todos', threshold: 50, description: '50 favoritos, ¡tu cocina es la mejor!' },
    { id: 'most_loved_recipe', name: 'La receta más amada', threshold: 100, description: 'Alcanza 100 favoritos. ¡Eres un ícono!' },
  ],
  // Logros por Especialidad
  specialties: [
    { id: 'dawn_master', name: 'Maestro del amanecer', threshold: 5, description: 'Has creado 5 recetas de Desayunos.', check: 'specialtyAchievement.Desayuno' },
    { id: 'midday_chef', name: 'El chef de medio día', threshold: 5, description: 'Has creado 5 recetas de Almuerzos.', check: 'specialtyAchievement.Almuerzo' },
    { id: 'night_chef', name: 'El chef nocturno', threshold: 5, description: 'Has creado 5 recetas de Cenas.', check: 'specialtyAchievement.Cena' },
    { id: 'king_of_cravings', name: 'El rey de los antojos', threshold: 5, description: 'Has creado 5 recetas de Snacks.', check: 'specialtyAchievement.Snack' },
    { id: 'sweet_master', name: 'El maestro del dulce', threshold: 5, description: 'Has creado 5 recetas de Postres.', check: 'specialtyAchievement.Postre' },
  ],
  // Logros Adicionales
  additional: [
    { id: 'culinary_explorer', name: 'El explorador culinario', threshold: 100, description: 'Has explorado 100 recetas en la aplicación.' },
    { id: 'gastronomic_critic', name: 'El crítico gastronómico', threshold: 10, description: 'Has comentado 10 recetas diferentes.' },
    { id: 'picture_perfect', name: 'Un plato de foto', threshold: 1, description: 'Has subido tu primera foto de un plato.' },
    { id: 'pantry_master', name: 'Maestro de la despensa', threshold: 1, description: 'Has creado una receta usando solo ingredientes de tu inventario.' },
    { id: 'gourmet_follower', name: 'El seguidor gourmet', threshold: 10, description: 'Has seguido a 10 chefs en la app.' },
  ],
};

const AchievementsScreen = () => {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [user, setUser] = useState(null);
  const [userAchievements, setUserAchievements] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [activeTab, setActiveTab] = useState('unlocked'); // 'unlocked' o 'all'

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [auth, navigate]);

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserAchievements(data.achievements || []);
        setUserProgress({
          recipesCreated: data.recipesCreated || 0,
          postsCommented: data.postsCommented || 0,
          recipesExplored: data.recipesExplored || 0,
          followingCount: data.followingCount || 0,
          specialtyAchievement: data.specialtyAchievement || {},
          recipesWithStarRating: data.recipesWithStarRating || {},
          // Asume que también tienes campos para otros logros como `firstPhoto`, etc.
          firstPhoto: data.firstPhoto || 0,
          pantryMasterAchieved: data.pantryMasterAchieved || false,
        });
        setLoading(false);
      } else {
        setError('No se encontraron datos de usuario.');
        setLoading(false);
      }
    }, (err) => {
      console.error('Error al obtener datos del usuario:', err);
      setError('Error al cargar tu progreso de logros.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, user]);

  const isAchievementUnlocked = (achievement) => {
    return userAchievements.includes(achievement.id);
  };

  const getProgress = (achievement) => {
    const { id, threshold, check } = achievement;
    if (check) {
      const parts = check.split('.');
      let value = userProgress;
      for (const part of parts) {
        value = value?.[part];
      }
      return Array.isArray(value) ? value.length : value;
    }

    switch (id) {
      case 'first_recipe':
      case 'apprentice_chef':
      case 'rising_master':
      case 'prolific_chef':
      case 'golden_chef':
      case 'culinary_legend':
        return userProgress.recipesCreated;
      case 'initial_popularity':
      case 'special_touch':
      case 'cookbook_star':
      case 'favorite_chef':
      case 'most_loved_recipe':
        return userProgress.favoritesCount;
      case 'culinary_explorer':
        return userProgress.recipesExplored;
      case 'gastronomic_critic':
        return userProgress.postsCommented;
      case 'picture_perfect':
        return userProgress.firstPhoto || 0;
      case 'pantry_master':
        return userProgress.pantryMasterAchieved ? 1 : 0;
      case 'gourmet_follower':
        return userProgress.followingCount;
      default:
        return 0;
    }
  };

  const openModal = (achievement) => {
    setSelectedAchievement(achievement);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAchievement(null);
  };
  
  const allAchievements = [
    ...ACHIEVEMENTS_DATA.recipesCreated,
    ...ACHIEVEMENTS_DATA.recipesRated,
    ...ACHIEVEMENTS_DATA.favorites,
    ...ACHIEVEMENTS_DATA.specialties,
    ...ACHIEVEMENTS_DATA.additional,
  ];

  const filteredAchievements = allAchievements.filter(ach => {
    return activeTab === 'unlocked' ? isAchievementUnlocked(ach) : true;
  });

  const renderAchievements = (achievements) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <AnimatePresence>
        {achievements.map((ach) => {
          const unlocked = isAchievementUnlocked(ach);
          const progress = getProgress(ach);
          return (
            <motion.div
              key={ach.id}
              onClick={() => openModal(ach)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`relative bg-white p-6 rounded-3xl shadow-lg cursor-pointer transition-transform duration-200 ${unlocked ? 'border-2 border-yellow-500' : 'opacity-60 grayscale'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${unlocked ? 'bg-yellow-100 text-yellow-500' : 'bg-gray-200 text-gray-400'}`}>
                  <Trophy className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h4 className={`text-xl font-bold ${unlocked ? 'text-gray-800' : 'text-gray-600'}`}>{ach.name}</h4>
                  <p className={`text-sm ${unlocked ? 'text-gray-600' : 'text-gray-500'}`}>{ach.description}</p>
                </div>
              </div>
              {unlocked && (
                <div className="absolute top-2 right-2 p-1 bg-green-500 rounded-full text-white">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
              {!unlocked && progress > 0 && (
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${Math.min((progress / ach.threshold) * 100, 100)}%` }}></div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex items-center justify-center p-6 text-center text-white">
        <Trophy className="w-20 h-20 animate-bounce mx-auto mb-4" />
        <p className="text-xl">Cargando logros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex items-center justify-center p-6 text-center text-red-200">
        <p className="text-xl">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 p-6">
        <motion.button
          onClick={() => navigate('/profile')}
          className="absolute top-4 left-4 flex items-center gap-2 text-white font-semibold bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Mi Perfil
        </motion.button>
        <div className="max-w-4xl mx-auto mt-16">
          <h1 className="text-4xl font-bold text-white text-center mb-8">
            <Trophy className="inline-block w-10 h-10 mr-4" />
            Mis Logros
          </h1>

          {/* Tabs para las secciones de logros */}
          <div className="flex bg-white/95 backdrop-blur-sm rounded-3xl p-2 mb-6 shadow-xl w-full max-w-sm mx-auto">
            <motion.button
              onClick={() => setActiveTab('unlocked')}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                activeTab === 'unlocked'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Mis Logros
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Todos los Logros
            </motion.button>
          </div>
          
          {renderAchievements(filteredAchievements)}
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md relative text-center"
            >
              <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-7 h-7" />
              </button>
              <Trophy className={`w-16 h-16 mx-auto mb-4 ${isAchievementUnlocked(selectedAchievement) ? 'text-yellow-500' : 'text-gray-400'}`} />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedAchievement.name}</h2>
              <p className="text-gray-600 mb-4">{selectedAchievement.description}</p>
              {isAchievementUnlocked(selectedAchievement) ? (
                <span className="text-green-500 font-semibold flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />¡Desbloqueado!
                </span>
              ) : (
                <div className="text-gray-500">
                  <p className="text-sm">Progreso: {getProgress(selectedAchievement) || 0} de {selectedAchievement.threshold}</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${Math.min((getProgress(selectedAchievement) / selectedAchievement.threshold) * 100, 100)}%` }}></div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AchievementsScreen;