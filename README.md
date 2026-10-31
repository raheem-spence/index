# Index

Index is a course-based collaboration platform designed to help students organize classes, share learning resources, and collaborate with classmates.

Index allows students to create or join courses, manage course-specific resources, and collaborate through shared notes. Access to resources is controlled through course membership, ensuring that only students within a course can view or contribute to that course's content.

Built with Java Spring Boot, PostgreSQL, and Vanilla JS.

---

## Features

- User signup and login
- HTTP session-based authentication
- Course creation and membership management
- Course-based resource access control
- Create, read, update and delete notes within courses
- DTO-based responses for clean JSON output
- Ownership and permission-based authorization for shared resources

---

## Tech Stack
### Backend

- Java
- Spring Boot
- Spring Data JPA / Hibernate
- Spring Security (session-based authentication)

### Database
- PostgreSQL

### Frontend
- HTML
- CSS
- Vanilla JS

---

## Authentication

This project uses **HTTP session-based authentication**.

- On login, the user ID is stored in the session
- Each request retrieves the user ID from the session
- No JWT or token-based authentication is used in this version

Authentication verifies who the user is. Authorization determines what courses and resources the user can access.

---

## Access Control Model

Index uses course-based authorization.

A user's access is determined by their relationship to a course. Only members of a course can access resources within that course.

Resources are owned by users but exist within courses, allowing collaboration while maintaining controlled access.

Resource permissions allow owners to grant additional access to other course members, such as viewing or editing shared notes.

---

## API Endpoints

### Authentication

- `POST /auth/signup` → Create a new account.
- `POST /auth/login` → Log in and create an authenticated session

### Courses

- `GET /course/my-courses` → Get courses associated with the logged-in user
- `POST /course/create` → Create a new course
- `POST /course/join` → Join an existing course using a join code

### Notes

- `GET /courses/{courseId}/notes` → Get notes accessible within a course
- `POST /courses/{courseId}/notes` → Create a note within a course
- `PUT /courses/{courseId}/notes/{noteId}` → Update a note (only if authorized)
- `DELETE /notes/{noteId}` → Delete a note (only if authorized)

## Sample API Requests

Below are real examples of how to interact with the API.

All requests except signup and login assume the user is already logged in and a session cookie is present.

---

### 1. Register User

```http
POST /auth/signup
Content-Type: application/json

{
  "firstName": "Izuku",
  "lastName": "Midoriya",
  "email": "test@email.com",
  "password": "password123"
}
```
### 2. Login User

```http
POST /auth/login
Content-Type: application/json

{
  "email": "test@email.com",
  "password": "password123"
}
```
### 3. Get Current User Notes for specific course
```http
GET /courses/{courseId}/notes
```
EXAMPLE
```http
GET /courses/1/notes
```
RESPONSE
```http
[
  {
    "content": "Organic compounds...",
    "courseId": 1,
    "courseName": "Chemistry",
    "createdAt": "2026-07-22T06:03:37.331420Z",
    "id": 41,
    "ownerFirstName": "Izuku",
    "ownerId": 1,
    "ownerLastName": "Midoriya",
    "title": "Organic compounds"
  }
]
```
### 4. Create Note within specific course

```http
POST /courses/{courseId}/notes
```
EXAMPLE
```http
POST /courses/1/notes
Content-Type: application/json

{
  "title": "Test note",
  "content": "Testing create note functionality"
}
```
RESPONSE
```http
{
    "content": "Testing create note functionality",
    "courseId": 1,
    "courseName": "Chemistry",
    "createdAt": "2026-07-23T18:56:56.877406Z",
    "id": 42,
    "ownerFirstName": "Izuku",
    "ownerId": 1,
    "ownerLastName": "Midoriya",
    "title": "Test note"
}
```
### 5. Update note within specific course
```http
PUT /courses/{courseId}/notes/{noteId}
```
EXAMPLE
```http
PUT /courses/1/notes/42
Content-Type: application/json

{
  "title": "Updated note",
  "content": "Testing updating note functionality"
}
```
RESPONSE
```http
{
    "content": "Updated",
    "courseId": 1,
    "courseName": "Chemistry",
    "createdAt": "2026-07-23T18:56:56.877406Z",
    "id": 42,
    "ownerFirstName": "Emelle",
    "ownerId": 2,
    "ownerLastName": "Spence",
    "title": "Updated note"
}
```
### 6. Delete Note within specific course

```http
DELETE /courses/{courseId}/notes/{noteId}
```
EXAMPLE
```http
DELETE /courses/1/notes/42
```
RESPONSE
```
204 No Content
```

---

## Data Model

### User
- id
- firstName
- lastName
- email
- passwordHash
- createdAt

### Course
- id
- name
- description
- school
- professor (optional)
- semester (optional)
- joinCode
- createdAt
- creator

### Course Membership
- id
- user
- course

### Note
- id
- title
- content
- createdAt
- updatedAt
- deletedAt
- owner (User)
- course (Course)

### Permission
- id
- user
- note
- permissionLevel (VIEWER, EDITOR)

### PermissionLevel (enum)
- VIEWER
- EDITOR

---

## Security Rules

- Users can only access courses they are members of
- Users can only access resources within courses they are members of 
- Resource permissions determine allowed actions
- Unauthorized or invalid actions return:
    - 403 Forbidden (not allowed)
    - 404 Not Found (missing resources)

---

## Architecture

Margin follows a layered Spring Boot architecture:
```text
Frontend (Vanilla JS)
    |
REST API
    |
Controller
    |
Service
    |
Repository
    |
PostgreSQL Database
```

## Project Status

Currently implemented:

- User authentication with session management
- Course creation and membership backend
- Notes CRUD implemented (Create, Read, Update, Delete)
- DTO layer added for clean API responses
- PostgreSQL persistence

Currently in development:

- UI / UX design and frontend/backend integration
- Course creation UI
- Course joining UI
- Empty states in frontend

---

## Roadmap

### Collaboration Features
- Shared documents and study guides
- Comments and discussions
- Expanded resource permissions
- Course invitations

### AI Features
- Semantic search across course resources
- AI-powered note summarization
- AI-assisted study tools
