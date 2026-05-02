import { useEffect, useState } from "react";

const blankForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  stock: "",
};

export default function ProductForm({
  editProduct,
  loading,
  onSubmit,
  onCancelEdit,
}) {
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    if (editProduct) {
      setForm({
        name: editProduct.name || "",
        description: editProduct.description || "",
        category: editProduct.category || "",
        price: String(editProduct.price ?? ""),
        stock: String(editProduct.stock ?? ""),
      });
      return;
    }

    setForm(blankForm);
  }, [editProduct]);

  const submit = async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
    };

    await onSubmit(payload);
    if (!editProduct) {
      setForm(blankForm);
    }
  };

  return (
    <section className="panel">
      <h3>{editProduct ? "Edit Product" : "Create Product"}</h3>
      <form className="form-grid" onSubmit={submit}>
        <label htmlFor="p-name">Name</label>
        <input
          id="p-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <label htmlFor="p-description">Description</label>
        <textarea
          id="p-description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <label htmlFor="p-category">Category</label>
        <input
          id="p-category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        />

        <label htmlFor="p-price">Price</label>
        <input
          id="p-price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />

        <label htmlFor="p-stock">Stock</label>
        <input
          id="p-stock"
          type="number"
          min="0"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          required
        />

        <div className="row-buttons">
          <button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : editProduct
                ? "Update Product"
                : "Create Product"}
          </button>
          {editProduct && (
            <button type="button" className="secondary" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
