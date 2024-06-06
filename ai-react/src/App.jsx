// src/App.js
import React, { useState } from 'react';
import axios from 'axios';
import PromptForm from './PromptForm';
import GeneratedContent from './GeneratedContent';

const App = () => {
  const [generatedContent, setGeneratedContent] = useState('');

  const handlePromptSubmit = async (prompt) => {
    try {
      const response = await axios.post('http://localhost:5000/api/generate', {
        prompt: prompt,
      });
      setGeneratedContent(response.data);
    } catch (error) {
      console.error('Error generating content:', error);
    }
  };

  return (
    <div>
      <h1>Generator</h1>
      <PromptForm onSubmit={handlePromptSubmit} />
      {generatedContent && <GeneratedContent content={generatedContent} />}
    </div>
  );
};

export default App;
