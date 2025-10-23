# 💳 Credit Card Statement Parser

An intelligent full-stack application that parses PDF credit card statements, extracts key summary data, and lists all transactions using the Google Gemini API.

It features a fast, client-side password check, a React-based interactive dashboard, and a secure Node.js backend. This tool allows you to quickly digitize and analyze your financial statements.

-----
## ✨ Features

  * **PDF Statement Upload:** Securely upload your PDF files with a drag-and-drop or file-picker interface.
  * **Instant Password Check:** The frontend uses `pdf.js` to immediately check if a file is password-protected *before* uploading, providing instant user feedback.
  * **AI-Powered Data Extraction:** Uses the Google Gemini API to read the PDF text and intelligently extract:
      * **Statement Summary:** Total amount due, due date, statement date, last 4 digits, etc.
      * **Full Transaction List:** A complete, itemized list of all transactions with date, description, and amount.
  * **AI Spending Categorization:** The extracted transactions are sent back to Gemini to be automatically categorized (e.g., "Shopping", "Food & Dining", "Travel").
  * **Interactive Dashboard:** A clean, tabbed UI to view your data:
      * **Summary:** Displays key financial data in easy-to-read cards.
      * **Spending Chart:** A doughnut chart (via Chart.js) that visualizes your spending by category.
      * **Transactions:** A searchable and filterable table of all your transactions.
  * **CSV Export:** Easily export your statement summary or your full transaction list as a `.csv` file.

-----

## 🚀 Tech Stack

### 🎨 Frontend (`/client`)

  * **React:** For building the user interface.
  * **Tailwind CSS:** For modern, utility-first styling.
  * **`pdfjs-dist`:** For performing the client-side password pre-check.
  * **Axios:** For making API requests to the backend.
  * **Chart.js (`react-chartjs-2`):** For rendering the spending breakdown chart.

### ⚙️ Backend (`/server`)

  * **Node.js:** As the JavaScript runtime.
  * **Express:** As the web server framework.
  * **Google Gemini API (`@google/generative-ai`):** For all AI-powered text extraction and categorization.
  * **`pdf-parse`:** A fast, server-side library to extract raw text from text-based PDFs.
  * **Multer:** For handling `multipart/form-data` (file uploads).
  * **CORS:** To enable cross-origin requests from the React app.
  * **DotEnv:** For managing environment variables (like your API key).

-----

## 🛠️ Setup and Installation

### Prerequisites

  * **Node.js** (v18.0 or newer recommended)
  * **npm** (comes with Node.js)
  * **A Google Gemini API Key:** You can get one for free from the [Google AI Studio](https://aistudio.google.com/app/apikey).

### 1\. Clone the Repository

```bash
git clone https://github.com/Karanjain487l/credit-card-parser.git
cd credit-card-parser
```

### 2\. Set Up the Backend (Server)

First, you need to add your Google Gemini API key.

1.  Navigate to the server directory:

    ```bash
    cd server
    ```

2.  Create a new file named `.env`:

    ```bash
    touch .env
    ```

3.  Open the `.env` file and add your API key:

    ```.env
    GOOGLE_API_KEY="YOUR_API_KEY_HERE"
    ```

4.  Install the backend dependencies:

    ```bash
    npm install
    ```

### 3\. Set Up the Frontend (Client)

1.  From the project's root directory, navigate to the client:

    ```bash
    cd ../client
    ```

2.  Install the frontend dependencies:

    ```bash
    npm install
    ```

-----

## 🏃‍♂️ Running the Application

You must have **two separate terminals** open to run this project.

### 1\. Start the Backend Server

  * In your first terminal:


```bash
# Navigate to the server folder
cd server

# Start the server
node server.js
```

> ✅ The server will be running on `http://localhost:5000`

### 2\. Start the Frontend App

  * In your second terminal:

```bash
# Navigate to the client folder
cd client

# Start the React development server
npm run dev
```

> ✅ The application will automatically open in your browser at `http://localhost:5173`

You can now upload your PDF statements\!

-----

## ⚠️ Disclaimer

This tool is for demonstration purposes. The accuracy of the extracted data is dependent on the PDF statement's format and the capabilities of the AI model. Always verify extracted data with your original document before making any financial decisions.
