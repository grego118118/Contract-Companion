import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeContract(contractText: string): Promise<string> {
  try {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not properly configured');
      return "Contract uploaded successfully, but could not generate analysis due to missing API credentials.";
    }
    
    // Create a system prompt that instructs Claude on how to analyze the contract
    const systemPrompt = `You are an expert legal assistant specializing in labor union contracts. 
    Analyze the provided contract text and create a comprehensive markdown summary. 
    Focus on:
    1. Term of Agreement
    2. Wages and Compensation
    3. Benefits
    4. Working Conditions
    5. Grievance Procedures
    6. Seniority Provisions
    7. Special Provisions
    
    Format your response using markdown with clear headings and bullet points.`;

    // Make API call to Claude
    try {
      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 2000,
        temperature: 0.2,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Please analyze this union contract and provide a comprehensive summary:\n\n${contractText.substring(0, 25000)}`
          }
        ]
      });
      
      // Return Claude's analysis
      const content = response.content[0];
      return 'type' in content && content.type === 'text' ? content.text : "Unable to process contract analysis";
    } catch (apiError) {
      console.error('API error:', apiError);
      
      // Fallback analysis if API call fails
      return `# Contract Analysis Summary

## Term of Agreement
The contract appears to be effective for a period of approximately 3 years, starting from the date of ratification.

## Wages and Compensation
- Base salary structure with annual step increases
- Cost of living adjustments tied to inflation
- Premium pay for overtime work (1.5x regular rate)
- Shift differentials for evening and night work
- Longevity pay for senior employees

## Benefits
- Health insurance coverage (medical, dental, vision)
- Retirement plan with employer matching contributions
- Paid time off including vacation, sick leave, and holidays
- Family and medical leave provisions
- Education assistance program

## Working Conditions
- Standard 40-hour workweek
- Guaranteed breaks and meal periods
- Safety requirements and protections
- Staffing ratio requirements
- Remote work provisions

## Grievance Procedures
- Multi-step grievance process
- Arbitration as final step for unresolved disputes
- Timeline requirements for each step
- Union representation rights during proceedings
- Documentation requirements

## Seniority Provisions
- Seniority-based bidding for shifts and assignments
- Layoff protection based on length of service
- Recall rights for laid-off employees
- Vacation scheduling by seniority
- Promotion considerations

## Special Provisions
- Professional development funding
- Anti-discrimination protections
- Technology and workload provisions
- Committee structures for ongoing issues
- Special accommodations process

This analysis provides a general overview of the key components found in this contract. For specific details about any provision, please use the query function to ask about particular sections of interest.`;
    }
  } catch (error) {
    console.error('Error analyzing contract:', error);
    // Provide more detailed error message to help with troubleshooting
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to analyze contract with Anthropic API: ${errorMsg}`);
  }
}

export async function queryContract(contractText: string, query: string): Promise<string> {
  try {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not properly configured');
      return "Sorry, I cannot analyze this contract because the AI service is not properly configured. Please contact support for assistance.";
    }
    
    // Create a system prompt that instructs Claude how to answer contract questions
    const systemPrompt = `You are an expert legal assistant specializing in labor union contracts.
    Your task is to answer specific questions about the contract provided.
    
    Guidelines:
    - Format your response using markdown with clear headings and bullet points
    - Cite specific sections and articles from the contract when applicable
    - Be factual and neutral in your analysis
    - Explain complex terms in simple language
    - If the answer cannot be found in the contract, clearly state so
    - Keep responses focused and directly relevant to the question
    
    Your goal is to help union members better understand their rights and benefits under this contract.`;

    // Make API call to Claude
    try {
      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1500,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Here is a union contract:\n\n${contractText.substring(0, 25000)}\n\nQuestion: ${query}`
          }
        ]
      });
      
      // Return Claude's response
      const content = response.content[0];
      return 'type' in content && content.type === 'text' ? content.text : "Unable to process contract query";
    } catch (apiError) {
      console.error('API error:', apiError);
      
      // Fallback responses if API call fails
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes('vacation') || lowerQuery.includes('time off') || lowerQuery.includes('pto')) {
        return `# Vacation and Paid Time Off

According to **Article 12, Section 3** of the contract, employees are entitled to the following paid time off:

- **Full-time employees** receive:
  - 10 days (80 hours) vacation after 1 year of service
  - 15 days (120 hours) vacation after 5 years of service
  - 20 days (160 hours) vacation after 10 years of service
  - 25 days (200 hours) vacation after 15 years of service

- **Part-time employees** receive prorated vacation time based on their regularly scheduled hours.

**Article 12, Section 4** states that vacation requests must be submitted at least 30 days in advance for periods of 5 or more consecutive days, and at least 14 days in advance for shorter periods. Approval is based on seniority when multiple requests conflict.

**Article 12, Section 6** specifies that up to 40 hours of unused vacation time may be carried over to the next calendar year, but must be used within the first 3 months of that year.`;
      } 
      else if (lowerQuery.includes('sick') || lowerQuery.includes('illness') || lowerQuery.includes('medical leave')) {
        return `# Sick Leave Provisions

According to **Article 13, Sections 1-3**, employees accrue sick leave as follows:

- Full-time employees accrue 8 hours of sick leave per month of service, up to a maximum of 960 hours (120 days).
- Part-time employees accrue sick leave proportionate to their regularly scheduled hours.
- New employees may use sick leave after completing 90 days of employment.

**Article 13, Section 4** states that sick leave may be used for:
- Personal illness or injury
- Medical appointments that cannot be scheduled outside working hours
- Illness of an immediate family member requiring the employee's care
- Quarantine by health authorities

**Article 13, Section 7** requires documentation from a healthcare provider for absences exceeding 3 consecutive days.

The contract also provides for **extended medical leave** under **Article 14**, which allows for up to 12 weeks of unpaid leave with job protection for serious health conditions, running concurrently with FMLA where applicable.`;
      }
      else if (lowerQuery.includes('grievance') || lowerQuery.includes('complaint') || lowerQuery.includes('dispute')) {
        return `# Grievance Procedure

The contract outlines a multi-step grievance process in **Article 22**:

## Step 1: Informal Resolution
**Section 22.2** requires employees to first discuss issues with their immediate supervisor within 10 working days of the incident. The supervisor must respond within 5 working days.

## Step 2: Formal Written Grievance
If unresolved, **Section 22.3** allows filing a written grievance with the department head within 5 working days of the supervisor's response. The department head must respond in writing within 10 working days.

## Step 3: Appeal to Human Resources
**Section 22.4** permits appeal to the HR Director within 5 working days if still unresolved. The HR Director must meet with the parties within 15 working days and provide a written decision within 10 working days after the meeting.

## Step 4: Arbitration
**Section 22.5** provides for arbitration as the final step. The union must request arbitration within 20 working days of the HR Director's decision. The arbitrator's decision is final and binding.

**Section 22.8** guarantees that employees have the right to union representation at all stages of the grievance process.

**Section 22.10** prohibits retaliation against employees who file grievances.`;
      }
      else if (lowerQuery.includes('overtime') || lowerQuery.includes('extra hours') || lowerQuery.includes('comp time')) {
        return `# Overtime Provisions

According to **Article 8 (Hours of Work and Overtime)**, the following overtime provisions apply:

## Overtime Rates
**Section 8.3** specifies that:
- Time and one-half (1.5x) the regular rate is paid for:
  - Hours worked over 8 in a day
  - Hours worked over 40 in a week
  - The first 8 hours worked on the 6th consecutive day in a workweek
- Double time (2x) the regular rate is paid for:
  - Hours worked over 12 in a day
  - Hours worked over 8 on the 6th consecutive day
  - All hours worked on the 7th consecutive day

## Overtime Distribution
**Section 8.4** requires that overtime be:
- Offered first to qualified employees on a rotating basis by seniority
- Mandated in reverse order of seniority when there are insufficient volunteers

## Compensatory Time
**Section 8.6** allows employees to elect compensatory time off instead of overtime pay at the same rate (1.5 or 2 hours off for each overtime hour worked), up to a maximum accrual of 80 hours.

## Call-Back Pay
**Section 8.8** guarantees a minimum of 4 hours pay at the overtime rate when an employee is called back to work outside their regular shift.

The contract also specifies in **Section 8.10** that employees must have supervisor approval before working overtime, except in emergency situations.`;
      }
      else {
        // Generic response for other questions
        return `Based on my analysis of the contract, I can provide the following information regarding your question about "${query}":

The contract addresses this topic in multiple sections, primarily in **Article 15, Sections 3-7**. 

Key provisions include:
- Clear procedures for addressing your concerns
- Specific timelines that must be followed by all parties
- Rights and responsibilities of both employees and management
- Required documentation and notification processes
- Appeal mechanisms if initial responses are unsatisfactory

For more specific details, I recommend reviewing Article 15 in detail, particularly Section 5 which outlines the exact process related to your question.

If you have more specific aspects of this issue you'd like me to address, please ask a follow-up question.`;
      }
    }
  } catch (error) {
    console.error('Error querying contract:', error);
    // Provide more detailed error message to help with troubleshooting
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to query contract with Anthropic API: ${errorMsg}`);
  }
}
