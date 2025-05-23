# Grievance API Endpoints

This document provides a summary of the API endpoints for managing grievances. All endpoints are prefixed with `/api/grievances`.

## 1. Create a New Grievance

*   **Endpoint:** `POST /`
*   **HTTP Method:** `POST`
*   **Description:** Creates a new grievance associated with the logged-in user and a specified contract.
*   **Authentication:** Required.
*   **Request Body:**
    *   `contractId` (integer, required): The ID of the contract related to the grievance.
    *   `description` (string, required, min 10 characters): A detailed description of the grievance.
    *   `violatedClause` (string, optional): Specific clause(s) of the contract that were violated.
    ```json
    {
      "contractId": 1,
      "description": "The work hours stipulated in clause 5.2 were exceeded without proper compensation.",
      "violatedClause": "Section 5, Clause 5.2 - Work Hours and Overtime"
    }
    ```
*   **Successful Response (201 Created):**
    *   Returns the newly created grievance object.
    ```json
    {
      "id": 123,
      "userId": "user-uuid-string",
      "contractId": 1,
      "violatedClause": "Section 5, Clause 5.2 - Work Hours and Overtime",
      "description": "The work hours stipulated in clause 5.2 were exceeded without proper compensation.",
      "status": "pending",
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-27T10:00:00.000Z"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If validation fails (e.g., missing required fields, description too short). Response includes error details.
    *   `500 Internal Server Error`: If there's an issue creating the grievance on the server.

## 2. Get All Grievances for User

*   **Endpoint:** `GET /`
*   **HTTP Method:** `GET`
*   **Description:** Retrieves a list of all grievances filed by the currently logged-in user.
*   **Authentication:** Required.
*   **Request Body:** None.
*   **Successful Response (200 OK):**
    *   Returns an array of grievance objects.
    ```json
    [
      {
        "id": 123,
        "userId": "user-uuid-string",
        "contractId": 1,
        "violatedClause": "Section 5, Clause 5.2",
        "description": "Work hours exceeded.",
        "status": "pending",
        "createdAt": "2023-10-27T10:00:00.000Z",
        "updatedAt": "2023-10-27T10:00:00.000Z"
      },
      {
        "id": 124,
        "userId": "user-uuid-string",
        "contractId": 2,
        "violatedClause": "Section 3, Clause 1.1",
        "description": "Safety protocols not followed.",
        "status": "filed",
        "createdAt": "2023-10-28T14:30:00.000Z",
        "updatedAt": "2023-10-29T09:00:00.000Z"
      }
    ]
    ```
*   **Error Responses:**
    *   `500 Internal Server Error`: If there's an issue fetching grievances.

## 3. Get a Specific Grievance by ID

*   **Endpoint:** `GET /:id`
*   **HTTP Method:** `GET`
*   **Description:** Retrieves a specific grievance by its ID. The user must be the owner of the grievance.
*   **Authentication:** Required.
*   **Request Body:** None.
*   **Parameters:**
    *   `:id` (integer, required): The ID of the grievance to retrieve (passed in the URL path).
*   **Successful Response (200 OK):**
    *   Returns the grievance object.
    ```json
    {
      "id": 123,
      "userId": "user-uuid-string",
      "contractId": 1,
      "violatedClause": "Section 5, Clause 5.2 - Work Hours and Overtime",
      "description": "The work hours stipulated in clause 5.2 were exceeded without proper compensation.",
      "status": "pending",
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-27T10:00:00.000Z"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If the provided ID is not a valid integer.
    *   `404 Not Found`: If the grievance is not found or the logged-in user does not have access to it.
    *   `500 Internal Server Error`: If there's an issue fetching the grievance.

## 4. Update Grievance Status

*   **Endpoint:** `PUT /:id/status`
*   **HTTP Method:** `PUT`
*   **Description:** Updates the status of a specific grievance. The user must be the owner of the grievance.
    *(Note: In a production system, permissions for status changes might be more restrictive, e.g., only certain roles can set to 'resolved').*
*   **Authentication:** Required.
*   **Request Body:**
    *   `status` (string, required): The new status for the grievance (e.g., "filed", "in_progress", "resolved", "closed").
    ```json
    {
      "status": "filed"
    }
    ```
*   **Parameters:**
    *   `:id` (integer, required): The ID of the grievance to update (passed in the URL path).
*   **Successful Response (200 OK):**
    *   Returns the updated grievance object.
    ```json
    {
      "id": 123,
      "userId": "user-uuid-string",
      "contractId": 1,
      "violatedClause": "Section 5, Clause 5.2 - Work Hours and Overtime",
      "description": "The work hours stipulated in clause 5.2 were exceeded without proper compensation.",
      "status": "filed",
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-30T11:15:00.000Z" 
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If the provided ID is not valid, or if `status` is missing or invalid.
    *   `404 Not Found`: If the grievance is not found or the logged-in user does not have access to update it.
    *   `500 Internal Server Error`: If there's an issue updating the grievance.
---

**General Notes on Grievance Object Fields:**
*   `id` (integer): Unique identifier for the grievance.
*   `userId` (string): Identifier of the user who filed the grievance.
*   `contractId` (integer): Identifier of the contract associated with the grievance.
*   `violatedClause` (string | null): The specific clause(s) violated, if provided.
*   `description` (string): Detailed description of the grievance.
*   `status` (string): Current status of the grievance (e.g., "pending", "filed", "resolved").
*   `createdAt` (timestamp): Date and time when the grievance was created.
*   `updatedAt` (timestamp): Date and time when the grievance was last updated.
