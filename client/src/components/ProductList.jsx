export default function ProductList({
  products,
  currentUser,
  loading,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return <p className="muted">Loading products...</p>;
  }

  if (!products.length) {
    return <p className="muted">No products available yet.</p>;
  }

  return (
    <section className="panel">
      <h3>Products</h3>
      <div className="product-grid">
        {products.map((product) => {
          const ownerId = product.createdBy?._id || product.createdBy;
          const isOwner = String(ownerId) === String(currentUser.id);
          const isAdmin = currentUser.role === "admin";

          return (
            <article className="product-card" key={product._id}>
              <h4>{product.name}</h4>
              <p>{product.description || "No description"}</p>
              <ul>
                <li>Category: {product.category}</li>
                <li>Price: ${Number(product.price).toFixed(2)}</li>
                <li>Stock: {product.stock}</li>
                <li>Owner: {product.createdBy?.name || "Unknown"}</li>
              </ul>
              <div className="row-buttons">
                {(isOwner || isAdmin) && (
                  <button type="button" onClick={() => onEdit(product)}>
                    Edit
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => onDelete(product._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
