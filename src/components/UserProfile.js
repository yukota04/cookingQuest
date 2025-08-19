import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Award,
  Heart,
  Upload,
  LogOut,
  BookOpen,
  Camera,
  ChefHat,
  Star,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../firebaseConfig";

const UserProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [favoritePostsData, setFavoritePostsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newFavoriteCuisine, setNewFavoriteCuisine] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");

  useEffect(() => {
    // Check URL query parameter for tab
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // Fetch user profile data
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setProfileData(data);
            setNewUsername(data.username || "");
            setNewBio(data.bio || "");
            setNewFavoriteCuisine(data.favoriteCuisine || "");
            setProfileImageUrl(data.profilePictureUrl || "");
          } else {
            // If no profile data, create a basic one (e.g., for new Google sign-ins)
            const defaultProfile = {
              username:
                currentUser.displayName || currentUser.email.split("@")[0],
              bio: "¡Un chef en progreso!",
              favoriteCuisine: "Variada",
              recipesPublished: 0,
              recipesLiked: 0,
              profilePictureUrl: "",
              favoritePosts: [],
            };
            await setDoc(userDocRef, defaultProfile);
            setProfileData(defaultProfile);
            setNewUsername(defaultProfile.username);
            setNewBio(defaultProfile.bio);
            setNewFavoriteCuisine(defaultProfile.favoriteCuisine);
            setProfileImageUrl(defaultProfile.profilePictureUrl);
          }

          // Fetch user's favorite recipes
          const favoritePostIds = userDocSnap.data()?.favoritePosts || [];
          if (favoritePostIds.length > 0) {
            const postsCollection = collection(db, "posts");
            const q = query(
              postsCollection,
              where("id", "in", favoritePostIds),
            );
            const querySnapshot = await getDocs(q);
            const fetchedPosts = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setFavoritePostsData(fetchedPosts);
          } else {
            setFavoritePostsData([]);
          }
        } catch (err) {
          console.error("Error fetching profile data or recipes:", err);
          setError("No se pudo cargar tu perfil. Inténtalo de nuevo.");
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/login"); // Redirect to login if not authenticated
      }
    });
    return () => unsubscribe();
  }, [auth, db, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
      alert("Error al cerrar sesión.");
    }
  };

  const handleProfileImageChange = (e) => {
    if (e.target.files[0]) {
      setProfileImageFile(e.target.files[0]);
      setProfileImageUrl(URL.createObjectURL(e.target.files[0])); // Show preview
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    let finalProfileImageUrl = profileImageUrl;
    if (profileImageFile) {
      try {
        const imageRef = ref(
          storage,
          `profile_pictures/${user.uid}-${Date.now()}`,
        );
        const snapshot = await uploadBytes(imageRef, profileImageFile);
        finalProfileImageUrl = await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.error("Error uploading profile picture:", err);
        setError("Error al subir la foto de perfil.");
        setLoading(false);
        return;
      }
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const updatedProfileData = {
        username: newUsername,
        bio: newBio,
        favoriteCuisine: newFavoriteCuisine,
        profilePictureUrl: finalProfileImageUrl,
      };
      await updateDoc(userDocRef, updatedProfileData);
      setProfileData((prev) => ({ ...prev, ...updatedProfileData }));
      setIsEditingProfile(false);
      alert("Perfil actualizado con éxito!");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Error al guardar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex items-center justify-center">
        <ChefHat className="w-20 h-20 animate-bounce text-white" />
        <p className="text-white text-xl ml-4">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex items-center justify-center">
        <p className="text-red-200 text-xl">{error}</p>
      </div>
    );
  }

  if (!user) {
    return null; // Should redirect to login, but just in case
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500">
      {/* Header */}
      <div className="bg-white/20 backdrop-blur-md p-4 flex items-center justify-between">
        <motion.button
          onClick={() => navigate("/menu")}
          className="flex items-center gap-2 text-white font-semibold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Menú Principal
        </motion.button>

        <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>

        <motion.button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogOut className="w-4 h-4" />
          Salir
        </motion.button>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl mb-6"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold mb-4 overflow-hidden">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : profileData?.username ? (
                profileData.username[0].toUpperCase()
              ) : (
                "U"
              )}
              {isEditingProfile && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                    id="profile-image-upload"
                  />
                  <label
                    htmlFor="profile-image-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-8 h-8" />
                  </label>
                </>
              )}
            </div>
            {isEditingProfile ? (
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="text-3xl font-bold text-gray-800 mb-2 text-center bg-gray-100 rounded-lg px-3 py-1"
              />
            ) : (
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {profileData?.username || "Usuario"}
              </h2>
            )}
            <p className="text-gray-600 flex items-center gap-2">
              <Mail className="w-4 h-4" /> {user.email}
            </p>
            {isEditingProfile ? (
              <textarea
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                className="text-gray-700 mt-3 italic text-center bg-gray-100 rounded-lg px-3 py-1 w-full h-20"
                placeholder="Tu biografía..."
              ></textarea>
            ) : (
              <p className="text-gray-700 mt-3 italic">
                "{profileData?.bio || "¡Un chef en progreso!"}"
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
            <div className="bg-blue-50 rounded-2xl p-4">
              <Award className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-800">Cocina Favorita</p>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={newFavoriteCuisine}
                  onChange={(e) => setNewFavoriteCuisine(e.target.value)}
                  className="text-sm text-gray-600 text-center bg-gray-100 rounded-lg px-2 py-1 w-full"
                />
              ) : (
                <p className="text-sm text-gray-600">
                  {profileData?.favoriteCuisine || "Variada"}
                </p>
              )}
            </div>
            <div className="bg-green-50 rounded-2xl p-4">
              <Upload className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-800">Recetas Publicadas</p>
              <p className="text-sm text-gray-600">
                {profileData?.recipesPublished || 0}
              </p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-800">Recetas Favoritas</p>
              <p className="text-sm text-gray-600">
                {profileData?.favoritePosts?.length || 0}
              </p>
            </div>
          </div>

          {isEditingProfile ? (
            <motion.button
              onClick={handleSaveProfile}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </motion.button>
          ) : (
            <motion.button
              onClick={() => setIsEditingProfile(true)}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <User className="w-5 h-5" />
              Editar Perfil
            </motion.button>
          )}
        </motion.div>

        {/* Tabs for Profile and My Recipes */}
        <div className="flex bg-white/95 backdrop-blur-sm rounded-3xl p-2 mb-6 shadow-xl">
          <motion.button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
              activeTab === "profile"
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <User className="inline-block mr-2" />
            Mi Perfil
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
              activeTab === "favorites"
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Star className="inline-block mr-2" />
            Mis Favoritos
          </motion.button>
        </div>

        {activeTab === "favorites" && (
          <>
            <h3 className="text-2xl font-bold text-white mb-4">
              Mis Publicaciones Favoritas ({favoritePostsData.length})
            </h3>
            <div className="space-y-4">
              {favoritePostsData.length === 0 ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 text-center text-gray-600 shadow-xl">
                  <p>
                    Aún no tienes publicaciones favoritas. ¡Explora el feed y
                    guarda tus preferidas!
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {favoritePostsData.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white/95 backdrop-blur-sm rounded-3xl p-5 shadow-md"
                    >
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">
                          {post.userName}
                        </h4>
                        <p className="text-sm text-gray-600">{post.text}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {post.imageUrl && (
                          <img
                            src={post.imageUrl}
                            alt="Post"
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex items-center text-yellow-500">
                          <Heart className="w-4 h-4 fill-current text-red-500" />
                          <span className="text-sm font-semibold ml-1">
                            {post.likesCount || 0} Likes
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </>
        )}

        {activeTab === "profile" && (
          // This content is already rendered above the tabs,
          // you might want to restructure if you want it strictly inside the tab
          // For now, it will just show the main profile view again.
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
            <p className="text-gray-700 text-center">
              Contenido principal del perfil.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
