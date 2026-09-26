import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Merhaba');
        console.log(`✅ Success with ${modelName}:`, result.response.text());
        return true;
    } catch (err) {
        console.log(`❌ Failed with ${modelName}:`, err.message);
        return false;
    }
}

async function run() {
    console.log('Testing Gemini API key:', apiKey ? 'Present' : 'Missing');
    await testModel('gemini-2.5-flash');
    await testModel('gemini-2.5-flash-latest');
    await testModel('gemini-2.5-pro');
    await testModel('gemini-2.0-pro');
    await testModel('gemini-pro');
}

run();
