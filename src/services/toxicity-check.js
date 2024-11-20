const axios = require('axios');

// Function to call Python service for toxicity check
async function checkToxicity(message) {
    try {
        const response = await axios.post('http://localhost:5001/api/analyze-message', { message });
        return response.data; // Returns the toxicity result from Python service
    } catch (error) {
        console.error('Error checking toxicity:', error);
        throw new Error('Toxicity check failed');
    }
}

module.exports = { checkToxicity };
