// src/components/FeedScreen.js
import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  increment,
  doc,
  arrayUnion,
  arrayRemove,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { app, db, storage } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  UserPlus,
  Share2,
  MessageCircle,
  Heart,
  Star,
  MoreVertical,
  Camera,
} from "lucide-react";

// Componente para una publicación individual en el feed
const PostItem = ({
  post,
  onLike,
  onFollow,
  onFavorite,
  onComment,
  onShare,
  onDeletePost,
  onEditPost,
  currentUserId,
  userFavorites,
  auth,
}) => {
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isFavorited = userFavorites.includes(post.id);
  const isAuthor = post.userId === currentUserId;

  useEffect(() => {
    const commentsQuery = query(
      collection(db, `posts/${post.id}/comments`),
      orderBy("timestamp"),
    );
    const unsubscribe = onSnapshot(commentsQuery, (querySnapshot) => {
      const fetchedComments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(fetchedComments);
    });
    return () => unsubscribe();
  }, [post.id]);

  useEffect(() => {
    const checkIfFollowing = async () => {
      const userRef = doc(db, "users", currentUserId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const followedUsers = userSnap.data().following || [];
        setIsFollowing(followedUsers.includes(post.userId));
      }
    };
    if (currentUserId !== "anonymous" && currentUserId !== post.userId) {
      checkIfFollowing();
    }
  }, [currentUserId, post.userId]);

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addDoc(collection(db, `posts/${post.id}/comments`), {
        userId: currentUserId,
        userName:
          auth.currentUser.displayName || auth.currentUser.email.split("@")[0],
        text: commentText,
        timestamp: new Date(),
      });
      setCommentText("");
    } catch (e) {
      console.error("Error adding comment: ", e);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 relative">
      {/* Three dots menu for author */}
      {isAuthor && (
        <div className="absolute top-4 right-4">
          <motion.button
            onClick={() => setShowMenu(!showMenu)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </motion.button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-2 z-10">
              <motion.button
                onClick={() => {
                  onEditPost(post);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                whileHover={{ scale: 1.05 }}
              >
                Editar
              </motion.button>
              <motion.button
                onClick={() => {
                  onDeletePost(post.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                whileHover={{ scale: 1.05 }}
              >
                Eliminar
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Post Header with Author Info and Follow Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center mr-3">
            <span className="text-orange-800 font-bold">
              {post.userName ? post.userName.charAt(0) : "A"}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-lg text-gray-800">{post.userName}</h4>
            <p className="text-sm text-gray-500">
              {post.timestamp
                ? new Date(post.timestamp.toDate()).toLocaleDateString()
                : "Fecha no disponible"}
            </p>
          </div>
        </div>
        {currentUserId !== "anonymous" && currentUserId !== post.userId && (
          <motion.button
            onClick={() => onFollow(post.userId, isFollowing)}
            className={`flex items-center gap-1 text-sm font-semibold rounded-full py-1 px-3 transition-colors duration-200 ${isFollowing ? "bg-gray-200 text-gray-600" : "bg-green-500 text-white"}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isFollowing ? (
              "Siguiendo"
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Seguir
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Post Content */}
      {post.text && <p className="text-gray-700 mb-4">{post.text}</p>}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post"
          className="w-full h-auto rounded-lg mb-4"
        />
      )}

      {/* Post Actions (Like, Favorite, Comment, Share) */}
      <div className="flex items-center justify-around space-x-4 mt-4 border-t border-gray-200 pt-4">
        {/* Like Button */}
        <motion.button
          onClick={() => onLike(post.id, currentUserId)}
          className="flex items-center text-gray-600 hover:text-red-500 transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className="h-5 w-5 mr-1 fill-current" />
          <span>{post.likesCount || 0} Likes</span>
        </motion.button>

        {/* Favorite Button */}
        <motion.button
          onClick={() => onFavorite(post.id, isFavorited)}
          className={`flex items-center text-gray-600 hover:text-yellow-500 transition-colors duration-200 ${isFavorited ? "text-yellow-500" : ""}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Star
            className={`h-5 w-5 mr-1 ${isFavorited ? "fill-current" : ""}`}
          />
          <span>Favorito</span>
        </motion.button>

        {/* Comment Button */}
        <motion.button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center text-gray-600 hover:text-blue-500 transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MessageCircle className="h-5 w-5 mr-1" />
          <span>{comments.length} Comentarios</span>
        </motion.button>

        {/* Share Button */}
        <motion.button
          onClick={() => onShare(post.text, post.imageUrl)}
          className="flex items-center text-gray-600 hover:text-purple-500 transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Share2 className="h-5 w-5 mr-1" />
          <span>Compartir</span>
        </motion.button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h5 className="font-bold text-gray-700 mb-3">Comentarios</h5>
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-100 p-3 rounded-xl">
                  <span className="font-semibold text-gray-800">
                    {comment.userName}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">{comment.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Sé el primero en comentar!
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Escribe un comentario..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              onClick={handlePostComment}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Comentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FeedScreen = () => {
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [image, setImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'following'
  const [followingList, setFollowingList] = useState([]);
  const [userFavorites, setUserFavorites] = useState([]);

  const auth = getAuth(app);
  const navigate = useNavigate();
  const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
  const userName = auth.currentUser
    ? auth.currentUser.displayName || "Anónimo"
    : "Anónimo";

  // Obtener publicaciones y lista de seguidos y favoritos en tiempo real
  useEffect(() => {
    const unsubscribePosts = onSnapshot(
      query(collection(db, "posts"), orderBy("timestamp", "desc")),
      (querySnapshot) => {
        const postsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);
      },
    );

    const unsubscribeFollowing = onSnapshot(
      doc(db, "users", userId),
      (docSnap) => {
        if (docSnap.exists()) {
          setFollowingList(docSnap.data().following || []);
          setUserFavorites(docSnap.data().favoritePosts || []); // Obtener la lista de favoritos
        }
      },
    );

    return () => {
      unsubscribePosts();
      unsubscribeFollowing();
    };
  }, [userId]);

  // Handle image selection via camera or gallery for web
  const handleImagePicker = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  // Handle image upload to Cloud Storage
  const handleImageUpload = async (file) => {
    if (!file) return null;
    const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      return imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  // Handle new post submission
  const handlePost = async () => {
    if (!newPostText.trim() && !image) {
      alert("La publicación no puede estar vacía.");
      return;
    }

    let imageUrl = null;
    if (image) {
      imageUrl = await handleImageUpload(image);
    }

    try {
      await addDoc(collection(db, "posts"), {
        userId,
        userName,
        text: newPostText,
        imageUrl,
        timestamp: new Date(),
        likesCount: 0,
      });
      setNewPostText("");
      setImage(null);
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Hubo un error al publicar. Inténtalo de nuevo.");
    }
  };

  // Handle like functionality
  const handleLike = async (postId, currentUserId) => {
    if (currentUserId === "anonymous") {
      alert("Debes iniciar sesión para dar like.");
      return;
    }
    const postRef = doc(db, "posts", postId);
    try {
      await updateDoc(postRef, {
        likesCount: increment(1),
      });
    } catch (e) {
      console.error("Error updating likes: ", e);
    }
  };

  // Handle favorite functionality
  const handleFavorite = async (postId, isFavorited) => {
    if (userId === "anonymous") {
      alert("Debes iniciar sesión para guardar publicaciones en favoritos.");
      return;
    }
    const userRef = doc(db, "users", userId);
    try {
      await updateDoc(userRef, {
        favoritePosts: isFavorited ? arrayRemove(postId) : arrayUnion(postId),
      });
    } catch (e) {
      console.error("Error al guardar en favoritos:", e);
    }
  };

  // Handle follow functionality
  const handleFollow = async (followedUserId, isFollowing) => {
    if (userId === "anonymous") {
      alert("Debes iniciar sesión para seguir a otros usuarios.");
      return;
    }
    const userRef = doc(db, "users", userId);
    try {
      await updateDoc(userRef, {
        following: isFollowing
          ? arrayRemove(followedUserId)
          : arrayUnion(followedUserId),
      });
    } catch (e) {
      console.error("Error al seguir/dejar de seguir usuario:", e);
    }
  };

  // Handle share functionality
  const handleShare = (text) => {
    alert(
      "Funcionalidad de compartir no implementada. Puedes copiar y pegar el texto:\n\n" +
        text,
    );
  };

  // Handle delete post functionality
  const handleDeletePost = async (postId) => {
    if (
      window.confirm("¿Estás seguro de que quieres eliminar esta publicación?")
    ) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        // You might also need to delete associated comments and images here
        alert("Publicación eliminada con éxito.");
      } catch (e) {
        console.error("Error al eliminar la publicación: ", e);
        alert("Error al eliminar la publicación.");
      }
    }
  };

  // Placeholder for edit functionality
  const handleEditPost = (post) => {
    alert(
      "Funcionalidad de edición no implementada. Post a editar:\n\n" +
        JSON.stringify(post),
    );
  };

  // Filtrar posts según la búsqueda y el tab
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchTerm === "" ||
      post.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const isFollowingPost =
      activeTab === "following" ? followingList.includes(post.userId) : true;
    return matchesSearch && isFollowingPost;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500">
      {/* Header with Back, Search, and Following buttons */}
      <div className="bg-white/20 backdrop-blur-md p-4 flex items-center justify-between">
        <motion.button
          onClick={() => navigate("/menu")}
          className="text-white font-semibold flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Atrás
        </motion.button>

        <div className="relative flex-1 mx-4">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="w-full pl-10 pr-4 py-2 rounded-full text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        <motion.button
          onClick={() =>
            setActiveTab(activeTab === "following" ? "all" : "following")
          }
          className={`flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-full transition-colors duration-200 ${
            activeTab === "following" ? "bg-orange-500" : "bg-white/20"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {activeTab === "following" ? "Todos" : "Seguidos"}
        </motion.button>
      </div>

      {/* Post creation section, with updated styles for rounded corners and shadow */}
      <div className="p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 mb-6">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-none focus:outline-none focus:border-orange-500"
            rows="3"
            placeholder="¿Qué estás cocinando hoy?"
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
          />
          {image && (
            <img
              src={URL.createObjectURL(image)}
              className="w-full h-auto rounded-lg mb-4"
              alt="Post preview"
            />
          )}
          <div className="flex justify-between items-center">
            <label
              htmlFor="image-upload"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200 flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              Subir Imagen
            </label>
            <input
              type="file"
              id="image-upload"
              onChange={handleImagePicker}
              className="hidden"
            />
            <motion.button
              onClick={handlePost}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Publicar
            </motion.button>
          </div>
        </div>

        {/* Posts feed */}
        <div className="space-y-6">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                onLike={handleLike}
                onFavorite={handleFavorite}
                onFollow={handleFollow}
                onShare={handleShare}
                onDeletePost={handleDeletePost}
                onEditPost={handleEditPost}
                currentUserId={userId}
                userFavorites={userFavorites}
                auth={auth} // Pasamos la instancia de auth a PostItem
              />
            ))
          ) : (
            <div className="text-center text-white text-lg font-semibold mt-10">
              No hay publicaciones para mostrar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedScreen;
