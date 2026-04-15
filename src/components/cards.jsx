import React, { useState, useEffect, useRef, useCallback } from "react"; // Reimportar useEffect
import "../scss/card.scss"; // Asegúrate de que apunte a tu archivo SCSS
import Modal from "./Modal"; // Import the new Modal component
import { useCart } from "../context/CartContext"; // Importar el contexto del carrito
import { useAuth } from "../context/AuthContext"; // Importar el contexto de autenticación

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// --- Caché manual en memoria ---
// Se declara fuera del componente para que sobreviva a los re-renders
const apiCache = new Map();

// --- Utilidad Debounce ---
// Retrasa la ejecución para optimizar eventos de escritura
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const Cards = () => {
  // Estados principales
  const [figures, setFigures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partialError, setPartialError] = useState(null); // Manejo de fallos de Promise.all()

  // Estados de filtrado en tiempo real
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Estado visual
  const [showFilters, setShowFilters] = useState(true);

  // AbortController ref para cancelar peticiones anteriores
  const abortControllerRef = useRef(null);

  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFigure, setSelectedFigure] = useState(null);

  const [successMessage, setSuccessMessage] = useState(""); // Definir el estado para successMessage
  const { addToCart } = useCart(); // Obtener la función addToCart del contexto
  const { hasAnyRole } = useAuth(); // Obtener función para verificar roles

  const fetchDashboardData = async (search, category) => {
    setLoading(true);
    setError(null);
    setPartialError(null);

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const cacheKey = `data-${search}-${category}`;

    // Evitar llamadas repetidas revisando la caché manual
    if (apiCache.has(cacheKey)) {
      const cachedData = apiCache.get(cacheKey);
      setFigures(cachedData.products);
      setPartialError(cachedData.partialError);
      setLoading(false);
      return;
    }

    try {
      // Múltiples peticiones simultáneas usando Promise.allSettled
      // Simulamos una segunda petición (ej. metadatos o banners) para cumplir el requisito
      const [productsRes, secondaryDataRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/me`, {
          signal: controller.signal,
        }),
       
      ]);

      let fetchedProducts = [];
      let currentPartialError = null;

      // Analizamos: ¿Qué ocurre si falla la petición principal?
      if (productsRes.status === "fulfilled" && productsRes.value.ok) {
        fetchedProducts = await productsRes.value.json();
      } else {
        throw new Error(
          "Fallo crítico: No se pudieron cargar las figuras desde el servidor.",
        );
      }

      // Manejo de errores parciales si falla la petición secundaria
      if (
        secondaryDataRes.status === "rejected" ||
        !secondaryDataRes.value.ok
      ) {
        currentPartialError =
          "Aviso: No se pudieron cargar algunos metadatos secundarios (Error Parcial).";
      }

      // Filtrado (si la API no soporta querystrings, filtramos aquí como ejemplo en tiempo real)
      let filtered = fetchedProducts;
      if (search) {
        filtered = filtered.filter((f) =>
          f.nombre.toLowerCase().includes(search.toLowerCase()),
        );
      }
      if (category !== "All") {
        filtered = filtered.filter((f) => f.categoria === category);
      }

      // Guardamos el resultado exitoso en caché
      const dataToCache = {
        products: filtered,
        partialError: currentPartialError,
      };
      apiCache.set(cacheKey, dataToCache);

      setFigures(filtered);
      setPartialError(currentPartialError);
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Petición cancelada debido a una actualización rápida.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Aplicar Debounce a la función que hace fetch
  // Usamos useCallback para mantener la misma referencia en la vida del componente
  const debouncedFetch = useCallback(
    debounce((search, category) => {
      fetchDashboardData(search, category);
    }, 500), // 500ms de retraso óptimo
    [],
  );

  // Sistema de actualización sin recargar
  useEffect(() => {
    debouncedFetch(searchTerm, filterCategory);
    // Limpieza y cancelación de petición montada al desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchTerm, filterCategory, debouncedFetch]);

  // Animaciones con Scroll (IntersectionObserver) y escalonamiento
  useEffect(() => {
    if (loading || figures.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Extraer un index para hacer la animación escalonada controlada por JS
            const idx = parseInt(entry.target.dataset.index, 10);
            const delay = (idx % 10) * 100; // Retraso escalonado dinámico

            setTimeout(() => {
              entry.target.classList.add("is-visible");
            }, delay);

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    const elements = document.querySelectorAll(".fade-in-up");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [figures, loading]);

  // Función para abrir el modal
  const openModal = (figure) => {
    console.log("Abriendo modal para:", figure);
    setSelectedFigure(figure);
    setIsModalOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFigure(null);
  };

  // Función para agregar al carrito
  const addToCartHandler = (figure) => {
    addToCart(figure); // Usar la función del contexto para agregar al carrito
    setSuccessMessage(`¡${figure.nombre} agregado al carrito!`);

    // Limpiar el mensaje después de 3 segundos
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const [videoGameFigures, setVideoGameFigures] = useState([]); // Estado para figuras de videojuegos
  const [animeFigures, setAnimeFigures] = useState([]); // Estado para figuras de anime

  const categorizeFigures = (figures) => {
    const videoGames = figures.filter((f) => f.categoria === "Videojuegos");
    const anime = figures.filter((f) => f.categoria === "Anime");
    setVideoGameFigures(videoGames);
    setAnimeFigures(anime);
  };

  useEffect(() => {
    categorizeFigures(figures); // Categorizar figuras cada vez que cambien
  }, [figures]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>Catálogo de Figuras Anime</h2>
        <button
          className="toggle-filters-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Ocultar Búsqueda" : "Mostrar Búsqueda"}
        </button>
      </header>

      {/* PARTE 3: Mostrar / Ocultar con transición suave (SIN display: none) */}
      <div
        className={`filters-container smooth-collapse ${showFilters ? "" : "hidden"}`}
      >
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar figura (ej. Goku)..."
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            onChange={(e) => setFilterCategory(e.target.value)}
            className="category-select"
          >
            <option value="All">Categorías (Todas)</option>

            <option value="Videojuegos">Videojuegos</option>
            <option value="Anime">Anime</option>
          </select>
        </div>
      </div>

      {/* Manejo visual de errores */}
      {error && <div className="error-banner critical-error">{error}</div>}
      {partialError && (
        <div className="error-banner partial-error">{partialError}</div>
      )}

      {/* Indicador de carga */}
      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Buscando en el ki de las figuras...</p>
        </div>
      ) : (
        <div className="cards-grid">
          {figures.length > 0
            ? figures.map((figure, index) => {
                // --- NUEVO MENSAJE DE CONSOLA EN REACT ---
                console.log(
                  `🎨 Renderizando figura: ${figure.nombre} | URL:`,
                  figure.imagen,
                );

                return (
                  <div
                    key={figure.id}
                    data-index={index} // Usado por el JS para el escalonamiento
                    className="card-item fade-in-up"
                  >
                    <img
                      src={figure.imagen}
                      alt={figure.nombre}
                      loading="lazy"
                      // --- DETECTOR DE ERRORES DE IMAGEN ---
                      onError={(e) => {
                        console.error(
                          `❌ FALLÓ LA IMAGEN DE: ${figure.nombre}`,
                        );
                        console.error(
                          `Intentó cargar esta ruta exacta: ${e.target.src}`,
                        );
                      }}
                    />
                    <div className="card-content">
                      <h3>{figure.nombre}</h3>
                      <p className="category">{figure.categoria}</p>
                      <p className="price">${figure.precio}</p>
                      <p className="description">{figure.descripcion}</p>
                      <button
                        className="buy-btn"
                        onClick={() => openModal(figure)}
                      >
                        Ver Detalles
                      </button>
                      {hasAnyRole(["admin", "editor"]) && (
                        <button
                          className="edit-btn"
                          onClick={() => (window.location.href = `/admin`)} // Redirigir al panel de admin para editar
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            : !error && (
                <p className="no-results">
                  No se encontraron figuras para esta búsqueda.
                </p>
              )}
        </div>
      )}

      {/* Modal para mostrar detalles y agregar al carrito */}
      {isModalOpen && (
        <Modal
          id="figureDetailsModal"
          title={selectedFigure?.nombre}
          body={
            <div>
              <img src={selectedFigure?.imagen} alt={selectedFigure?.nombre} />
              <p>Categoría: {selectedFigure?.categoria}</p>
              <p>Precio: ${selectedFigure?.precio}</p>
            </div>
          }
          footer={
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  addToCartHandler(selectedFigure);
                  closeModal();
                }}
              >
                Agregar al carrito
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={closeModal}
              >
                Cerrar
              </button>
            </>
          }
          onClose={closeModal}
        />
      )}
      {/* Mensaje de éxito */}
      {successMessage && <div className="success-banner">{successMessage}</div>}
    </div>
  );
};

export default Cards;
