import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key-for-development',
});

export async function analyzeContract(contractText: string): Promise<string> {
  try {
    const prompt = `I'd like you to analyze this union contract and create a structured summary of its main components. 
    Focus on key sections like:
    - Term of agreement
    - Wages and compensation
    - Benefits (healthcare, retirement, etc.)
    - Working conditions
    - Grievance procedures
    - Seniority provisions
    - Any special provisions or unique aspects

    Here's the contract text:
    ${contractText}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Error analyzing contract:', error);
    throw new Error('Failed to analyze contract with Anthropic API');
  }
}

export async function queryContract(contractText: string, query: string): Promise<string> {
  try {
    const prompt = `You are a helpful assistant for union members who want to understand their union contract. 
    Your task is to answer questions about the contract based on the contract text provided.
    
    For your responses:
    1. Always cite specific sections and page numbers when answering questions
    2. If the contract doesn't address the question directly, make that clear
    3. Provide objective, factual information based only on what's in the contract
    4. Format your answers clearly with section references in bold or as references at the end
    5. Keep answers concise but comprehensive
    
    Here's the contract text:
    ${contractText}
    
    User's question: ${query}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Error querying contract:', error);
    throw new Error('Failed to query contract with Anthropic API');
  }
}
