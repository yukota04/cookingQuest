import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  User,
  Clock,
  Package,
  Flame,
  MessageSquare,
  Send,
  ImagePlus,
} from "lucide-react";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../firebaseConfig";

const RecipeDetailModal = ({ isOpen, onClose, recipeId, onStartCooking }) => {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [rating, setRating] = useState(0); // User's current rating for this recipe
  const [hoverRating, setHoverRating] = useState(0); // For star hover effect

  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!isOpen || !recipeId) {
      setRecipe(null);
      setLoading(true);
      setError(null);
      setComments([]);
      setCommentText("");
      setRating(0);
      setHoverRating(0);
      return;
    }

    const fetchRecipe = async () => {
      try {
        const recipeDocRef = doc(db, "recipes", recipeId);
        const docSnap = await getDoc(recipeDocRef);
        if (docSnap.exists()) {
          setRecipe({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Receta no encontrada.");
        }
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError("Error al cargar la receta.");
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = () => {
      const commentsCollectionRef = collection(
        db,
        "recipes",
        recipeId,
        "comments",
      );
      const q = query(commentsCollectionRef, orderBy("createdAt", "asc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedComments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setComments(fetchedComments);
        },
        (err) => {
          console.error("Error fetching comments:", err);
          setError("Error al cargar los comentarios.");
        },
      );
      return unsubscribe;
    };

    fetchRecipe();
    const unsubscribeComments = fetchComments();

    return () => {
      if (unsubscribeComments) unsubscribeComments();
    };
  }, [isOpen, recipeId, db]);

  const handleAddComment = async () => {
    if (!currentUser) {
      alert("Debes iniciar sesión para comentar.");
      return;
    }
    if (!commentText.trim()) return;

    try {
      await addDoc(collection(db, "recipes", recipeId, "comments"), {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email.split("@")[0],
        comment: commentText,
        createdAt: new Date(),
      });
      setCommentText("");
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Error al añadir comentario.");
    }
  };

  const handleRateRecipe = async (newRating) => {
    if (!currentUser) {
      alert("Debes iniciar sesión para valorar recetas.");
      return;
    }
    if (newRating === rating) {
      // Allow un-rating if clicked again
      newRating = 0;
    }
    setRating(newRating); // Optimistic update

    const recipeRef = doc(db, "recipes", recipeId);
    try {
      const recipeDoc = await getDoc(recipeRef);
      const currentRatings = recipeDoc.data().userRatings || {};
      const oldRating = currentRatings[currentUser.uid] || 0;

      const totalRatingSum =
        (recipeDoc.data().totalRatingSum || 0) - oldRating + newRating;
      const ratingCount =
        Object.keys(currentRatings).length +
        (oldRating === 0 && newRating > 0
          ? 1
          : oldRating > 0 && newRating === 0
            ? -1
            : 0);
      const averageRating = ratingCount > 0 ? totalRatingSum / ratingCount : 0;

      await updateDoc(recipeRef, {
        totalRatingSum: totalRatingSum,
        ratingCount: ratingCount,
        averageRating: averageRating,
        [`userRatings.${currentUser.uid}`]: newRating > 0 ? newRating : null, // Store user's specific rating
      });
      alert("¡Gracias por tu valoración!");
    } catch (err) {
      console.error("Error rating recipe:", err);
      alert("Error al valorar la receta. Inténtalo de nuevo.");
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md relative text-center"
        >
          <p className="text-gray-700">Cargando receta...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md relative text-center"
        >
          <p className="text-red-500">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 text-blue-500 hover:underline"
          >
            Cerrar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-2xl h-[90vh] overflow-y-auto relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>

        {recipe.imageUrl && (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-64 object-cover rounded-2xl mb-6"
          />
        )}

        <h2 className="text-3xl font-bold text-gray-800 mb-3">{recipe.name}</h2>
        <p className="text-gray-600 text-lg mb-4">{recipe.description}</p>

        <div className="flex items-center gap-4 mb-6 text-gray-700">
          <div className="flex items-center gap-1">
            <User className="w-5 h-5" />
            <span>{recipe.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-5 h-5" />
            <span>{recipe.totalTime}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-5 h-5 fill-current" />
            <span>
              {(recipe.averageRating || 0).toFixed(1)} (
              {recipe.ratingCount || 0} votos)
            </span>
          </div>
        </div>

        {/* User Rating Section */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            Valora esta receta:
          </h3>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 cursor-pointer transition-colors ${
                  (hoverRating || rating) >= star
                    ? "text-yellow-500 fill-current"
                    : "text-gray-300"
                }`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRateRecipe(star)}
              />
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            Ingredientes:
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {recipe.ingredients &&
              recipe.ingredients.map((ing, index) => (
                <li key={index}>{ing}</li>
              ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-3">Pasos:</h3>
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            {recipe.steps &&
              recipe.steps.map((step, index) => (
                <li key={index}>{step.instruction}</li>
              ))}
          </ol>
        </div>

        {/* Comments Section */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            Comentarios ({comments.length}):
          </h3>
          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-sm text-center">
                Sé el primero en comentar esta receta.
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white p-3 rounded-lg shadow-sm"
                >
                  <p className="font-semibold text-gray-800">
                    {comment.userName}
                  </p>
                  <p className="text-gray-700 text-sm">{comment.comment}</p>
                  <p className="text-gray-500 text-xs text-right">
                    {comment.createdAt?.toDate().toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          {currentUser ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Añade un comentario..."
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
              />
              <motion.button
                onClick={handleAddComment}
                className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="w-4 h-4" />
                Enviar
              </motion.button>
            </div>
          ) : (
            <p className="text-gray-500 text-center">
              Inicia sesión para dejar un comentario.
            </p>
          )}
        </div>

        <motion.button
          onClick={() => onStartCooking(recipe)}
          className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ChefHat className="w-6 h-6" />
          ¡Empezar a Cocinar!
        </motion.button>
      </motion.div>
    </div>
  );
};

export default RecipeDetailModal;
