const express = require('express');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const multer = require('multer');
const app = express();
const FormData = require('form-data');
const PORT = process.env.PORT || 5000;

let modelChoice;
// Middleware
app.use(cors()); // Enable CORS for all requests
app.use(express.json()); // for parsing application/json

const upload = multer(); // Defaults to storing files in memory

// Proxy configuration
const apiServiceURL = "https://api.alpha.directai.io"; // URL of the target server you want to proxy to

const credentials = {
    'client_id': 'DIRECTAI_CLIENT_ID_HERE', // Replace with actual ID
    'client_secret': 'DIRECTAI_CLIENT_SECRET_HERE' // Replace with actual secret
}


// Modify as you wish
const modelDefinition = {
    "detector_configs": [
      {
        "name": "door",
        "examples_to_include": [
          "door"
        ],
        "examples_to_exclude": [],
        "detection_threshold": 0.15
      },
      {
        "name": "window",
        "examples_to_include": [
          "window"
        ],
        "examples_to_exclude": [],
        "detection_threshold": 0.15
      }
    ],
    "nms_threshold": 0.25
}

app.post('/detect', upload.single('data'), async (req, res) => { // Use multer middleware to handle multipart/form-data
    console.log('Request body:', req.body); // req.body will contain the text fields
    console.log('Files:', req.file); // req.files will contain files uploaded

    try {
        // Depending on your use case, you might want to include the files or form fields in the request to the API
        const response = await axios.post(`${apiServiceURL}/token`, credentials);
        console.log('Response from API:', response.data);
        const headers = {
            "Authorization": `Bearer ${response.data.access_token}`
        }
        const formData = new FormData();
        // Append the file to formData. Ensure the 'data' field matches the API's expected field name
        formData.append('data', req.file.buffer, req.file.originalname);
        
        // You might need to adjust headers for multipart/form-data, form-data library will handle it
        const formHeaders = formData.getHeaders();
        console.log("MODEL CHOICE");
        console.log(modelChoice);
        const detectResponse = await axios.post(`${apiServiceURL}/detect`, formData, {
            params: modelChoice,
            headers: {
                ...headers,
                ...formHeaders, // Include form-data generated headers
            },
        });
        console.log('Response from API:', detectResponse.data);
        res.status(200).send(detectResponse.data); // Forward the response from the API to the client
    } catch (error) {
      console.error('Error making the request:', error);
      res.status(500).send('Error making the request to the API');
    }
});

async function runOnStartup() {
    console.log('Running on startup');
    const response = await axios.post(`${apiServiceURL}/token`, credentials);
    console.log('Response from API:', response.data);
    const headers = {
        "Authorization": `Bearer ${response.data.access_token}`
    }
    
    const detectResponse = await axios.post(`${apiServiceURL}/deploy_detector`, modelDefinition, {
        headers: headers,
    });
    console.log('Response from API:', detectResponse.data);
    return detectResponse.data.deployed_id;
}


async function startServer() {
    try {
        // Await any async startup tasks here
        const modelId = await runOnStartup();
        console.log("model id", modelId);
        modelChoice = {
            'deployed_id': modelId
        }
      // Start listening after the async tasks are done
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start the server:', error);
    }
  }
  
// Call startServer to boot up your application
startServer();