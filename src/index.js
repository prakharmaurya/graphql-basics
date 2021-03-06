const express = require('express')
const { ApolloServer, gql } = require('apollo-server-express')

//demo data
const users = [
  { id: '1', name: 'apple', email: 'apple@a.com', age: 28 },
  { id: '2', name: 'banana', email: 'banana@b.com' },
  { id: '3', name: 'kivi', email: 'kivi@k.com', age: 28 },
]
const posts = [
  {
    id: '11',
    title: 'apple',
    body: 'xrexhcfjvghbjnk',
    published: true,
    author: '1',
  },
  {
    id: '12',
    title: 'banana',
    body: 'grrhcfjbhnk',
    published: true,
    author: '1',
  },
  { id: '13', title: 'kivi', body: 'trdfyguio', published: true, author: '3' },
]
const commentsArr = [
  {
    user: '2',
    post: '11',
    body: 'comment on post 1 by user 2',
  },
  {
    user: '1',
    post: '12',
    body: 'comment on post 2 by user 1',
  },
  {
    user: '3',
    post: '12',
    body: 'comment on post 2 by user 3',
  },
  {
    user: '1',
    post: '13',
    body: 'comment on post 3 by user 1',
  },
]

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    users(query: String): [User!]!
    posts(query: String): [Post!]!
    comments(query: String): [Comment!]!
    me(id: String): User
    post(id: String): Post
  }
  type Mutation {
    createUser(data: CreateUserInput): User!
    createPost(data: CreatePostInput): Post!
    createComment(data: CreateCommentInput): Comment!
  }

  input CreateUserInput {
    name: String!
    email: String!
    age: Int
  }

  input CreatePostInput {
    title: String!
    body: String!
    published: Boolean!
    author: ID!
  }

  input CreateCommentInput {
    user: ID!
    post: ID!
    body: String!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    age: Int
    posts: [Post!]!
    comments: [Comment!]!
  }
  type Post {
    id: ID!
    title: String!
    body: String!
    published: Boolean!
    author: User!
    comments: [Comment!]!
  }
  type Comment {
    user: User!
    post: Post!
    body: String!
  }
`
// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    users(parent, args, ctx, info) {
      if (!args.query) {
        return users
      }

      return users.filter((user) => {
        return user.name.toLowerCase().includes(args.query.toLowerCase())
      })
    },
    posts(parent, args, ctx, info) {
      if (!args.query) {
        return posts
      }

      return posts.filter((post) => {
        const t = post.title.toLowerCase().includes(args.query.toLowerCase())
        const b = post.body.toLowerCase().includes(args.query.toLowerCase())
        return t || b
      })
    },
    comments(parent, args, ctx, info) {
      if (!args.query) {
        return commentsArr
      }

      return commentsArr.filter((c) => {
        return c.body.toLowerCase().includes(args.query.toLowerCase())
      })
    },
    me(parent, args, ctx, info) {
      if (!args.id) {
        return null
      }
      return users.find((u) => {
        return u.id === args.id
      })
    },
    post(parent, args, ctx, info) {
      if (!args.id) {
        return null
      }
      return posts.find((p) => {
        return p.id === args.id
      })
    },
  },
  Mutation: {
    createUser(parent, { data }, ctx, info) {
      const emailTaken = users.some((u) => u.email === data.email)
      if (emailTaken) {
        return new Error('Email Taken')
      }
      const user = {
        id: Date.now(),
        email: data.email,
        name: data.name,
        age: data.age,
      }
      users.push(user)
      return user
    },
    createPost(parent, { data }, ctx, info) {
      const userExists = users.find((u) => u.id === data.author)
      if (!userExists) {
        return new Error('This user does not exist')
      }
      const post = {
        id: 'p-' + Date.now(),
        title: data.title,
        body: data.body,
        published: data.published,
        author: userExists.id,
      }
      posts.push(post)
      return post
    },
    createComment(parent, { data }, ctx, info) {
      const userExists = users.find((u) => u.id === data.user)
      const postExists = posts.find((p) => p.id === data.post)

      if (!userExists || !postExists) {
        return new Error('Post or user DNE')
      }

      const comment = {
        user: data.user,
        post: data.post,
        body: data.body,
      }

      commentsArr.push(comment)
      return comment
    },
  },
  Post: {
    author(parent, args, ctx, info) {
      return users.find((user) => {
        return user.id === parent.author
      })
    },
    comments(parent, args, ctx, info) {
      return commentsArr.filter((c) => {
        return c.post === parent.id
      })
    },
  },
  User: {
    posts(parent, args, ctx, info) {
      return posts.filter((post) => {
        return post.author === parent.id
      })
    },
    comments(parent, args, ctx, info) {
      return commentsArr.filter((c) => {
        return c.user === parent.id
      })
    },
  },
  Comment: {
    user(parent, args, ctx, info) {
      return users.find((u) => {
        return parent.user === u.id
      })
    },
    post(parent, args, ctx, info) {
      return posts.find((p) => {
        return parent.post === p.id
      })
    },
  },
}

const server = new ApolloServer({ typeDefs, resolvers })

const app = express()
server.applyMiddleware({ app })

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
)
