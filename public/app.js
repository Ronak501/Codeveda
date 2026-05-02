const API_BASE = "/api/users";

const userForm = document.getElementById("user-form");
const userIdInput = document.getElementById("user-id");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const messageEl = document.getElementById("message");
const usersContainer = document.getElementById("users-container");
const refreshBtn = document.getElementById("refresh-btn");
const formTitle = document.getElementById("form-title");

function setMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.classList.toggle("error", isError);
}

function resetForm() {
  userIdInput.value = "";
  userForm.reset();
  submitBtn.textContent = "Create User";
  formTitle.textContent = "Add User";
  cancelBtn.classList.add("hidden");
}

function startEdit(user) {
  userIdInput.value = String(user.id);
  nameInput.value = user.name;
  emailInput.value = user.email;
  submitBtn.textContent = "Update User";
  formTitle.textContent = "Edit User";
  cancelBtn.classList.remove("hidden");
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = data?.message || "Request failed";
    const validation = data?.errors?.length
      ? `: ${data.errors.join(", ")}`
      : "";
    throw new Error(message + validation);
  }

  return data;
}

function createUserCard(user) {
  const card = document.createElement("article");
  card.className = "user-item";

  const meta = document.createElement("div");
  meta.className = "user-meta";
  meta.innerHTML = `<strong>${user.name}</strong><span>${user.email}</span>`;

  const actions = document.createElement("div");
  actions.className = "user-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => startEdit(user));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", async () => {
    try {
      await request(`${API_BASE}/${user.id}`, { method: "DELETE" });
      setMessage("User deleted successfully.");
      await loadUsers();
      if (Number(userIdInput.value) === user.id) {
        resetForm();
      }
    } catch (error) {
      setMessage(error.message, true);
    }
  });

  actions.append(editBtn, deleteBtn);
  card.append(meta, actions);

  return card;
}

async function loadUsers() {
  try {
    const users = await request(API_BASE);
    usersContainer.innerHTML = "";

    if (!users.length) {
      usersContainer.textContent = "No users found. Add one above.";
      return;
    }

    users.forEach((user) => usersContainer.appendChild(createUserCard(user)));
  } catch (error) {
    usersContainer.textContent = "Could not load users.";
    setMessage(error.message, true);
  }
}

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
  };

  const userId = userIdInput.value;

  try {
    if (userId) {
      await request(`${API_BASE}/${userId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setMessage("User updated successfully.");
    } else {
      await request(API_BASE, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("User created successfully.");
    }

    resetForm();
    await loadUsers();
  } catch (error) {
    setMessage(error.message, true);
  }
});

cancelBtn.addEventListener("click", () => {
  resetForm();
  setMessage("Edit canceled.");
});

refreshBtn.addEventListener("click", async () => {
  await loadUsers();
  setMessage("Users refreshed.");
});

loadUsers();
