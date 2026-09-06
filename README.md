# Mindful Journal AI

A secure, user-authenticated journaling web application powered by **Gemini 3.6 Flash** and **Cloud Firestore**, featuring **Reflection Intelligence** and strict user-isolated storage.

---

## Architecture Overview

- **User Authentication**: Firebase Authentication via Federated Google Sign-In. Passwords are never collected or stored in application code.
- **Backend Service Layer**: Express on Node.js running on Google Cloud Run, serving API proxies and client assets.
- **Database & Persistence**: Google Cloud Firestore with strict owner-bound security rules (`/users/{userId}/entries/{entryId}`).
- **AI Processing Engine**: Gemini 3.6 Flash using `@google/genai` with an automated resilient model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`).
- **Secret Management**: Google Cloud Secret Manager storing the `GEMINI_API_KEY`, dynamically injected into the Cloud Run container at runtime.

---

## 1. Prerequisites & Environment Setup

### Required Tools
- [Google Cloud SDK (`gcloud` CLI)](https://cloud.google.com/sdk/docs/install)
- [Firebase CLI](https://firebase.google.com/docs/cli) (optional, for direct rules deployment)
- Node.js 20+ & npm / bun

### Enable Google Cloud APIs
Run the following commands to enable the required Google Cloud APIs for your project:

```bash
# Set your active Google Cloud project ID
export PROJECT_ID="YOUR_PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable Cloud Run, Secret Manager, Cloud Build, and Firestore APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com
```

---

## 2. Firebase Authentication & Firestore Setup

1. In the [Firebase Console](https://console.firebase.google.com/), create or link your Google Cloud project.
2. Under **Build > Authentication**, click **Get Started** and enable **Google** under Sign-in providers.
3. Under **Build > Firestore Database**, create a Firestore database (default or named instance) in Native mode.
4. Download or configure your client settings in `firebase-applet-config.json`:

```json
{
  "projectId": "YOUR_PROJECT_ID",
  "appId": "YOUR_APP_ID",
  "apiKey": "YOUR_WEB_API_KEY",
  "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "YOUR_PROJECT_ID.firebasestorage.app",
  "messagingSenderId": "YOUR_MESSAGING_SENDER_ID"
}
```

---

## 3. Firestore Security Rules (User Data Isolation)

Deploy the following `firestore.rules` to enforce strict deny-by-default access and guarantee cross-tenant data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Deny all access by default
    match /{document=**} {
      allow read, write: if false;
    }

    // User-isolated collections: Only the authenticated owner can access their entries
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Deploy the rules via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Google Cloud Secret Manager Setup

The application strictly forbids hardcoded API keys. Follow these steps to provision `GEMINI_API_KEY` in Secret Manager and grant read access to Cloud Run.

### Step 4.1: Create Secret and Add Key
```bash
# 1. Create the secret resource
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add the secret version with your Gemini API key
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

### Step 4.2: Grant Access to Cloud Run Service Account
Fetch the project number and bind the `secretAccessor` role to the default compute service account used by Cloud Run:

```bash
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. Cloud Run Deployment Flow

Deploy the container directly to Cloud Run using `gcloud run deploy`. Notice that `--set-secrets` mounts the secret directly into `process.env.GEMINI_API_KEY`, and the mandatory verification label is included.

```bash
# Deploy container with Secret Manager binding and campaign verification label
gcloud run deploy mindful-journal-ai \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --update-labels=dev-tutorial=cloud-run-ai-challenge
```

### Verify Deployment Labels
Confirm that the label was successfully registered:
```bash
gcloud run services describe mindful-journal-ai \
  --region asia-southeast1 \
  --format="value(metadata.labels)"
```

---

## 6. Security Analysis & Threat Model

| Threat Zone | Potential Vulnerability | Implemented Mitigation |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Large request payloads, XSS injection via journal reflections | `express.json` limited to 1MB; messages capped at 10,000 characters; React JSX output encoding. |
| **2. Planning & Reasoning** | Prompt injection trying to bypass reflection instructions or leak credentials | Delimited `<journal_entry>` XML tagging isolates reflection text as data; system prompts command strict non-execution of inner commands. |
| **3. Tool Execution** | Browser-side API key leakage, model rate limits | Server-side Express proxy keeps `GEMINI_API_KEY` hidden; 4-tier model fallback ladder with error recovery classification. |
| **4. Memory & State** | Cross-user journal access, client UID spoofing | Backend decodes and cryptographically verifies Firebase ID tokens; Firestore rules enforce `request.auth.uid == userId`. |
| **5. Inter-System Comm** | Password compromise, insecure transmission | Federated Google Sign-In avoids custom password management; tokens passed over TLS Bearer headers. |

---

## 7. Complete User-Walkthrough Testing Plan

Every user-facing flow has a corresponding verification test case:

### Test Case 1: Unauthenticated Landing & Google Sign-In
- **Action**: Open the application URL without an active session.
- **Expected Result**: The Landing Page displays clear privacy highlights and a "Sign in with Google" button. The dashboard is not accessible.
- **Action**: Click "Sign in with Google" and complete authentication in the popup.
- **Expected Result**: Authenticated state is detected, the navbar displays user photo/name, and the app transitions to the private dashboard.

### Test Case 2: User Data Isolation & New Entry Creation
- **Action**: Click "New Reflection" in the sidebar.
- **Expected Result**: A new document is written to Firestore at `/users/{current_uid}/entries/{entry_id}`. The title defaults to "New Reflection".
- **Security Check**: Attempting to query another user's path directly returns a Firestore Permission Denied error.

### Test Case 3: Multi-Turn Reflection Dialogue with Gemini
- **Action**: Select "Deep Reflection" mode, type a journal thought (e.g., *"I've been feeling torn between two projects at work"*), and press Cmd+Enter.
- **Expected Result**:
  1. The user thought is persisted to Firestore immediately (never cleared if the network fails).
  2. A typing indicator appears while the backend calls Gemini 3.6 Flash.
  3. Gemini returns an empathetic, constructive response formatted in clean Markdown.
  4. The conversation history is updated in Firestore under the active entry.

### Test Case 4: Focus Modes (Brainstorm & Synthesis)
- **Action**: Switch focus mode to "Brainstorm" and ask for creative approaches to a challenge.
- **Expected Result**: Gemini adapts its persona to generate divergent ideas and actionable options.

### Test Case 5: Reflection Intelligence Extraction
- **Action**: Click "Analyze Intelligence" or "Generate Reflection Intelligence".
- **Expected Result**: The backend analyzes the full reflection thread and displays:
  - **Mood & Tone**: Descriptive badge and numeric 1-5 gauge bar.
  - **Key Thoughts**: 3-5 summarized bullet points.
  - **Action Items**: Concrete next steps with interactive checkboxes.
  - **Provocative Question**: A deep coaching inquiry for future contemplation.
  - **Summary**: Concise distillation saved to Firestore.

### Test Case 6: Interactive Action Items Tracking
- **Action**: Click the checkbox on an action item inside the Intelligence card.
- **Expected Result**: The item is crossed out with a strikethrough and visual checkmark.

### Test Case 7: Search and Past Entries Navigation
- **Action**: Type a keyword in the sidebar search bar.
- **Expected Result**: The list filters in real-time, showing only entries matching the title or message content.
- **Action**: Click a previous entry.
- **Expected Result**: The multi-turn conversation and previously extracted intelligence reload seamlessly.

### Test Case 8: Weekly Reflection Dashboard & AI Synthesis
- **Action**: Click "Weekly Intelligence" in the top navigation bar.
- **Expected Result**: The dashboard aggregates reflections logged over the past 7 days, showing average mood score, total entries, and weekly action items.
- **Action**: Click "Generate Weekly AI Synthesis".
- **Expected Result**: Gemini produces a holistic executive review with Dominant Themes, Emotional Trajectory, Core Wins, and Focus for Next Week.

### Test Case 9: Input Persistence Failure Guard
- **Action**: Simulate a network error or offline state and submit a reflection.
- **Expected Result**: An error alert banner is displayed; the user's typed text remains intact in the editor with a retry option, guaranteeing zero data loss.

### Test Case 10: Sign Out & Session Teardown
- **Action**: Click "Sign Out" in the top navbar.
- **Expected Result**: Firebase session terminates, in-memory journal state is cleared, and the user is safely returned to the landing page.
