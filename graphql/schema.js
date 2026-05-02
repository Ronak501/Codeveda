const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
  }

  type Product {
    id: ID!
    name: String!
    description: String
    category: String!
    price: Float!
    stock: Int!
    createdBy: User!
    createdAt: String!
    updatedAt: String!
  }

  type Notification {
    id: ID!
    type: String!
    title: String!
    body: String!
    link: String
    readAt: String
    createdAt: String!
    user: User!
  }

  type Message {
    id: ID!
    body: String!
    readAt: String
    createdAt: String!
    sender: User!
    recipient: User!
  }

  type Pagination {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
  }

  type ProductConnection {
    items: [Product!]!
    pagination: Pagination!
  }

  type AuthPayload {
    message: String!
    user: User!
    token: String!
  }

  type MessageResult {
    ok: Boolean!
    message: String!
  }

  type Query {
    me: User
    products(page: Int = 1, limit: Int = 10, search: String, category: String): ProductConnection!
    product(id: ID!): Product
    notifications(limit: Int = 20): [Notification!]!
    conversations(withUserId: ID!): [Message!]!
  }

  type Mutation {
    signup(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createProduct(name: String!, description: String, category: String!, price: Float!, stock: Int!): Product!
    updateProduct(id: ID!, name: String!, description: String, category: String!, price: Float!, stock: Int!): Product!
    deleteProduct(id: ID!): MessageResult!
    markNotificationRead(id: ID!): Notification!
    sendMessage(recipientId: ID!, body: String!): MessageResult!
  }
`;

module.exports = typeDefs;
