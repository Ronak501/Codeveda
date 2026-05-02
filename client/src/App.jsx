import { useCallback, useEffect, useState } from "react";
import { authApi, productApi } from "./api";
import LoadingState from "./components/LoadingState";
import AuthPanel from "./components/AuthPanel";
import ProductForm from "./components/ProductForm";
import ProductList from "./components/ProductList";
import { createSocket } from "./realtime/socket";
import RealtimePanel from "./features/RealtimePanel";
import GraphQLPanel from "./features/GraphQLPanel";

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [authMode, setAuthMode] = useState("login");
  const [editProduct, setEditProduct] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [socket, setSocket] = useState(null);

  const clearNotices = () => {
    setMessage("");
    setError("");
  };

  const loadProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      return;
    }

    setLoadingProducts(true);
    try {
      const data = await productApi.list({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
      });
      setProducts(data.items || []);
      setPagination(
        data.pagination || {
          page: currentPage,
          totalPages: 1,
          total: (data.items || []).length,
        },
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingProducts(false);
    }
  }, [currentPage, pageSize, searchQuery, user]);

  useEffect(() => {
    async function bootstrap() {
      try {
        const data = await authApi.me();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoadingSession(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (user) {
      loadProducts();
    } else {
      setProducts([]);
      setPagination({ page: 1, totalPages: 1, total: 0 });
    }
  }, [user, loadProducts]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return undefined;
    }

    const connection = createSocket();
    setSocket(connection);
    connection.connect();

    return () => {
      connection.disconnect();
      setSocket(null);
    };
  }, [user]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleAuth = async (payload) => {
    clearNotices();
    setLoadingAuth(true);

    try {
      const data =
        authMode === "signup"
          ? await authApi.signup(payload)
          : await authApi.login(payload);
      setUser(data.user);
      setMessage(
        authMode === "signup"
          ? "Signup completed successfully."
          : "Logged in successfully.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    clearNotices();
    try {
      await authApi.logout();
      setUser(null);
      setEditProduct(null);
      setMessage("Logged out successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveProduct = async (payload) => {
    clearNotices();
    setSavingProduct(true);

    try {
      if (editProduct) {
        await productApi.update(editProduct._id, payload);
        setMessage("Product updated.");
      } else {
        await productApi.create(payload);
        setMessage("Product created.");
      }

      setEditProduct(null);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDelete = async (id) => {
    clearNotices();
    try {
      await productApi.remove(id);
      setMessage("Product deleted.");
      if (editProduct && editProduct._id === id) {
        setEditProduct(null);
      }
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loadingSession) {
    return (
      <main className="layout">
        <LoadingState text="Checking session..." />
      </main>
    );
  }

  return (
    <main className="layout">
      <header className="hero">
        <h1>Inventory Admin Portal</h1>
        <p>React frontend + Node API + JWT auth + MongoDB persistence.</p>
      </header>

      {message && <p className="notice success">{message}</p>}
      {error && <p className="notice error">{error}</p>}

      {!user ? (
        <AuthPanel
          mode={authMode}
          loading={loadingAuth}
          onModeChange={setAuthMode}
          onSubmit={handleAuth}
        />
      ) : (
        <>
          <section className="panel user-summary">
            <div>
              <h2>{user.name}</h2>
              <p>
                {user.email} | role: <strong>{user.role}</strong>
              </p>
              <p className="muted small">User ID: {user.id}</p>
            </div>
            <button type="button" className="secondary" onClick={handleLogout}>
              Logout
            </button>
          </section>

          <ProductForm
            editProduct={editProduct}
            loading={savingProduct}
            onSubmit={handleSaveProduct}
            onCancelEdit={() => setEditProduct(null)}
          />

          <section className="panel product-toolbar">
            <label htmlFor="product-search">Search Products</label>
            <input
              id="product-search"
              placeholder="Search by name or description"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <p className="muted small">
              Total products: {pagination.total || 0}
            </p>
          </section>

          <ProductList
            products={products}
            currentUser={user}
            loading={loadingProducts}
            onEdit={setEditProduct}
            onDelete={handleDelete}
          />

          {socket && <RealtimePanel socket={socket} currentUser={user} />}

          <GraphQLPanel />

          <section className="panel pagination-controls">
            <button
              type="button"
              className="secondary"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1 || loadingProducts}
            >
              Previous
            </button>
            <p>
              Page {pagination.page || currentPage} of{" "}
              {pagination.totalPages || 1}
            </p>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, pagination.totalPages || 1),
                )
              }
              disabled={
                currentPage >= (pagination.totalPages || 1) || loadingProducts
              }
            >
              Next
            </button>
          </section>
        </>
      )}
    </main>
  );
}
