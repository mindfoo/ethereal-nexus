// index.js
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Route to handle AI prompt
app.post('/api/generate', async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      max_tokens: 100,
      temperature: 0.7,
      messages: [
            {
              "role": "system",
              "content": "You are a helpful assistant."
            },
            {
              "role": "user",
              "content": prompt
            }
          ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data.choices.map(choice => choice.message.content));
    //console.log(response.data)
  } catch (error) {
    console.error('Error generating content:', error.response.data);
    //res.status(500).send('Error generating content');
    return error.response.data;
  }
});

app.get('/', (req, res) => { res.send('Hello, world!'); });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
