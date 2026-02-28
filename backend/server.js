const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse'); // Standard CJS import
const { 
    GoogleGenerativeAI, 
    HarmCategory, 
    HarmBlockThreshold,
    SchemaType // Imported SchemaType for rock-solid schemas
} = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash" 
});

const generationConfig = {
    temperature: 0.1,
    topK: 1,
    topP: 1,
    maxOutputTokens: 8192,
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const extractionSchema = {
    type: SchemaType.OBJECT,
    properties: {
        totalBalance: { type: SchemaType.STRING },
        dueDate: { type: SchemaType.STRING },
        statementDate: { type: SchemaType.STRING },
        last4Digits: { type: SchemaType.STRING },
        minPayment: { type: SchemaType.STRING },
        purchasesDebit: { type: SchemaType.STRING },
        paymentsCredits: { type: SchemaType.STRING },
        totalCreditLimit: { type: SchemaType.STRING },
        availableCreditLimit: { type: SchemaType.STRING },
        availableCashLimit: { type: SchemaType.STRING },
        previousStatementDues: { type: SchemaType.STRING },
        transactions: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    date: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING },
                    amount: { type: SchemaType.STRING }
                }
            }
        }
    }
};

const categorizationSchema = {
    type: SchemaType.OBJECT,
    properties: {
        categories: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
        }
    }
};

async function extractDataFromText(text) {
    const prompt = `From the credit card statement text provided, you MUST extract both the summary details AND a complete list of all individual transactions. It is critical that the 'transactions' array is populated. If no transactions are found, return an empty array for the transactions field. For all other fields, return "Not Found" if the data is missing. Format all currency values with the Indian Rupee symbol (₹). Text: --- ${text.substring(0, 30000)} ---`;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { ...generationConfig, responseMimeType: "application/json", responseSchema: extractionSchema },
        safetySettings,
    });
    
    // Using the built-in .text() method is much safer
    return JSON.parse(result.response.text());
}

async function categorizeTransactions(transactions) {
    const descriptions = transactions.map(t => t.description).filter(Boolean);
    if (descriptions.length === 0) return [];

    const prompt = `Categorize each of these transaction descriptions into one of these categories: Shopping, Food & Dining, Travel, Utilities, Entertainment, Health & Wellness, Groceries, Other. Return a JSON object with a 'categories' array containing the category for each description in the same order. Descriptions: ${JSON.stringify(descriptions)}`;
    
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { ...generationConfig, responseMimeType: "application/json", responseSchema: categorizationSchema },
        safetySettings,
    });

    return JSON.parse(result.response.text()).categories;
}

app.post('/api/parse-statement', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const password = req.body.password;
        const dataBuffer = req.file.buffer;
        
        // Correct pdf-parse implementation
        const options = password ? { password: password } : {};
        const pdfResult = await pdf(dataBuffer, options);
        const text = pdfResult.text;

        const extractedData = await extractDataFromText(text);        

        let categories = [];
        if (extractedData.transactions && extractedData.transactions.length > 0) {
            categories = await categorizeTransactions(extractedData.transactions);
        }
        
        res.json({
            ...extractedData,
            categories: categories 
        });

    } catch (error) {
        // pdf.js throws a PasswordException if it hits an encrypted file without the right password
        if (error.name === 'PasswordException' || (error.message && error.message.includes('Password'))) {            
            return res.status(400).json({ error: 'password_required' });
        }
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Failed to process PDF.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
