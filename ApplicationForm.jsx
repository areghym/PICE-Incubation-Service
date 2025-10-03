// Server-side pseudocode using Express and Multer
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFileToS3 } = require('./s3-service'); // Secure cloud upload function
// Define storage strategy: memory storage is best for immediate upload to cloud
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/pdf|doc|docx/)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type: must be PDF or DOCX.'), false);
        }
    }
});

router.post('/application', upload.fields([{ name: 'pitchDeck', maxCount: 1 }]), async (req, res) => {
    try {
        // 1. Handle File Uploads
        const pitchDeckFile = req.files['pitchDeck'][0];
        const s3Key = await uploadFileToS3(pitchDeckFile); // Returns secure URL/key

        // 2. Data Sanitization & Validation (Omitted for brevity, but mandatory)
        const { founderName, email, ventureName, gdprConsent } = req.body; 

        // 3. Database Save
        const submissionId = await db.insertApplication({
            founderName, 
            email, 
            ventureName,
            pitchDeckUrl: s3Key, // Store the secure cloud path
            gdprConsent,
            status: 'Submitted',
            createdAt: new Date()
        });
        
        // 4. Send Emails (Admin & User)
        await sendConfirmationEmail(email, submissionId);
        await sendAdminNotification(submissionId);

        res.status(200).json({ success: true, submissionId });

    } catch (error) {
        console.error('Application Submission Error:', error);
        res.status(500).json({ success: false, message: 'Submission failed due to server error.' });
    }
});

## 3. Database Schema Design (MySQL/PostgreSQL)

A centralized database with distinct tables for each form ensures clean data separation and efficient querying.

### 1. `applications` (For the main Application Form)

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **`id`** | `INT` | Primary Key, Auto-Increment | Unique Application ID. |
| **`unique_tracking_id`**| `VARCHAR(36)` | Unique Index | Public ID for status tracking. |
| `founder_name` | `VARCHAR(255)` | NOT NULL | Applicant's name. |
| `email` | `VARCHAR(255)` | NOT NULL | Applicant's email. |
| `venture_name` | `VARCHAR(255)` | NOT NULL | Name of the startup. |
| `industry` | `VARCHAR(100)` | | Startup's industry focus. |
| `pitch_deck_url` | `TEXT` | NOT NULL | Secure URL/Key for pitch deck in cloud storage. |
| `status` | `VARCHAR(50)` | Default: 'Submitted' | (Submitted, Under Review, Interview, Accepted, Rejected). |
| `gdpr_consent` | `BOOLEAN` | NOT NULL | User's privacy consent. |
| `created_at` | `TIMESTAMP` | NOT NULL | Submission date/time. |

### 2. `contact_messages` (For the Contact Form)

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | Primary Key, Auto-Increment | |
| `name` | `VARCHAR(255)` | NOT NULL | |
| `email` | `VARCHAR(255)` | NOT NULL | |
| `phone` | `VARCHAR(50)` | | Optional phone number. |
| `message` | `TEXT` | NOT NULL | The user's query. |
| `is_resolved` | `BOOLEAN` | Default: FALSE | Admin tracking status. |

### 3. `event_registrations` (For Event Registration)

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | Primary Key, Auto-Increment | |
| `event_name` | `VARCHAR(255)` | NOT NULL | Name of the event registered for. |
| `email` | `VARCHAR(255)` | NOT NULL | Attendee email (for ticketing/communication). |
| `organization` | `VARCHAR(255)` | | Attendee's organization. |

### 4. `network_signups` (For Mentor/Investor Signup)

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | Primary Key, Auto-Increment | |
| `name` | `VARCHAR(255)` | NOT NULL | |
| `role` | `VARCHAR(50)` | NOT NULL | ('Mentor' or 'Investor'). |
| `expertise_areas` | `VARCHAR(500)` | | Comma-separated or JSON array of skills. |
| `cv_url` | `TEXT` | | Secure URL/Key for CV/Profile Document. |
| `status` | `VARCHAR(50)` | Default: 'Pending Review' | Admin review status. |

## 4. Security Best Practices

Implementing these security measures is mandatory to ensure GDPR compliance and protect sensitive business plans and user data.

| Threat/Requirement | Mitigation Strategy |
| :--- | :--- |
| **Data in Transit** | **SSL/TLS (HTTPS)**: All communications between the client and server must be encrypted. |
| **Data at Rest** | **Database Encryption**: Encrypt sensitive fields (e.g., email, phone) within the database. Store files (Pitch Decks, CVs) in secure, private cloud buckets (S3/GCS) with restricted access and path obscurity, never on the web server itself. |
| **Cross-Site Request Forgery (CSRF)** | **Token Verification**: Implement CSRF tokens on all state-changing forms (`POST`, `PUT`, `DELETE`). Express middleware like `csurf` can handle this. |
| **Input Injections** | **Input Sanitization**: Use libraries (e.g., `validator.js`) to strictly sanitize and validate all user inputs to prevent XSS (Cross-Site Scripting) and SQL Injection attacks. **Never** trust user input. |
| **Bot Submissions** | **reCAPTCHA/Honeypots**: Implement a non-intrusive reCAPTCHA (v3) or a honeypot field on all public forms to prevent automated spam and abuse. |
| **Access Control** | **Authentication & Authorization**: Ensure that only authenticated administrators can access the dashboard to view, search, and export the submitted data. |
| **Admin Dashboard** | **Audit Logging**: Record all actions taken by administrators (e.g., 'Admin accepted application X,' 'Admin exported data'). |