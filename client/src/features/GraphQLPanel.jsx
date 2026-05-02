import { useState } from "react";

async function graphqlRequest(query, variables = {}) {
  const response = await fetch("/graphql", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();
  if (data.errors?.length) {
    throw new Error(data.errors[0].message);
  }
  return data.data;
}

export default function GraphQLPanel() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState(
    "Use GraphQL to fetch data efficiently",
  );
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
  });

  const loadProducts = async () => {
    setLoading(true);
    setMessage("Loading via GraphQL...");
    try {
      const data = await graphqlRequest(
        `
        query Products($search: String) {
          products(limit: 5, search: $search) {
            items {
              id
              name
              category
              price
              stock
              description
            }
          }
        }
      `,
        { search },
      );
      setItems(data.products.items || []);
      setMessage(`Loaded ${data.products.items.length} products from GraphQL`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async () => {
    setLoading(true);
    setMessage("Creating product via GraphQL...");
    try {
      await graphqlRequest(
        `
        mutation CreateProduct($name: String!, $description: String, $category: String!, $price: Float!, $stock: Int!) {
          createProduct(name: $name, description: $description, category: $category, price: $price, stock: $stock) {
            id
            name
          }
        }
      `,
        {
          name: form.name,
          description: form.description,
          category: form.category,
          price: Number(form.price),
          stock: Number(form.stock),
        },
      );
      setMessage("Product created with GraphQL");
      setForm({
        name: "",
        category: "",
        price: "",
        stock: "",
        description: "",
      });
      await loadProducts();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>GraphQL Explorer</h3>
          <p className="muted small">{message}</p>
        </div>
      </div>

      <div className="form-grid">
        <label htmlFor="graphql-search">Search Products</label>
        <input
          id="graphql-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search via GraphQL"
        />
        <div className="row-buttons">
          <button type="button" onClick={loadProducts} disabled={loading}>
            Fetch via GraphQL
          </button>
        </div>
      </div>

      <div className="stack-list">
        {items.map((item) => (
          <article key={item.id} className="mini-card">
            <strong>{item.name}</strong>
            <p>
              {item.category} · ${Number(item.price).toFixed(2)} · stock{" "}
              {item.stock}
            </p>
          </article>
        ))}
      </div>

      <div className="form-grid" style={{ marginTop: "1rem" }}>
        <h4>Create Product via GraphQL</h4>
        <label>Name</label>
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <label>Description</label>
        <input
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
        />
        <label>Category</label>
        <input
          value={form.category}
          onChange={(event) =>
            setForm({ ...form, category: event.target.value })
          }
        />
        <label>Price</label>
        <input
          type="number"
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
        />
        <label>Stock</label>
        <input
          type="number"
          value={form.stock}
          onChange={(event) => setForm({ ...form, stock: event.target.value })}
        />
        <button type="button" onClick={createProduct} disabled={loading}>
          Create via GraphQL
        </button>
      </div>
    </section>
  );
}
