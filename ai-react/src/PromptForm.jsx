// src/PromptForm.js
import React, { useState } from 'react';

const PromptForm = ({ onSubmit }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(prompt);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="prompt">Enter your prompt:</label>
        <input
          type="text"
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      <button type="submit">Generate</button>
    </form>
  );
};

export default PromptForm;
