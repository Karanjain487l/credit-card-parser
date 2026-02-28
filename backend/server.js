const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// Change the model name to a stable version like "gemini-1.5-flash"
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash" 
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
    type: "OBJECT",
    properties: {
        totalBalance: { type: "STRING" },
        dueDate: { type: "STRING" },
        statementDate: { type: "STRING" },
        last4Digits: { type: "STRING" },
        minPayment: { type: "STRING" },
        purchasesDebit: { type: "STRING" },
        paymentsCredits: { type: "STRING" },
        totalCreditLimit: { type: "STRING" },
        availableCreditLimit: { type: "STRING" },
        availableCashLimit: { type: "STRING" },
        previousStatementDues: { type: "STRING" },
        transactions: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    date: { type: "STRING" },
                    description: { "type": "STRING" },
                    amount: { "type": "STRING" }
                }
            }
        }
    }
};

const categorizationSchema = {
    type: "OBJECT",
    properties: {
        categories: {
            type: "ARRAY",
            items: { type: "STRING" }
        }
    }
};

async function extractDataFromText(text) {
    const prompt = `From the credit card statement text provided, you MUST extract both the summary details AND a complete list of all individual transactions. It is critical that the 'transactions' array is populated. If no transactions are found, return an empty array for the transactions field. For all other fields, return "Not Found" if the data is missing. Format all currency values with the Indian Rupee symbol (₹). Text: --- ${text.substring(0, 30000)} ---`;

    const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { ...generationConfig, responseMimeType: "application/json", responseSchema: extractionSchema },
        safetySettings,
    });
    
    const response = result.response;
    return JSON.parse(response.candidates[0].content.parts[0].text);
}

async function categorizeTransactions(transactions) {
    const descriptions = transactions.map(t => t.description).filter(Boolean);
    if (descriptions.length === 0) return [];

    const prompt = `Categorize each of these transaction descriptions into one of these categories: Shopping, Food & Dining, Travel, Utilities, Entertainment, Health & Wellness, Groceries, Other. Return a JSON object with a 'categories' array containing the category for each description in the same order. Descriptions: ${JSON.stringify(descriptions)}`;
    
    const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { ...generationConfig, responseMimeType: "application/json", responseSchema: categorizationSchema },
        safetySettings,
    });

    const response = result.response;
    return JSON.parse(response.candidates[0].content.parts[0].text).categories;
}

app.post('/api/parse-statement', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const password = req.body.password;
                
        const dataBuffer = req.file.buffer;
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: dataBuffer, password: password });
        const textResult = await parser.getText();
        const text = textResult.text;
        console.log(text)


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
