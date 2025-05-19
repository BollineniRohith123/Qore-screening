import { DemoConfig, ParameterLocation, SelectedTool } from "@/lib/types";

function getSystemPrompt() {
  let sysPrompt: string;
  sysPrompt = `
  # QORE Candidate Screening System Configuration

  ## Agent Role
  - Name: QORE Screening Assistant
  - Context: Short 10-minute initial candidate screening call with AI-powered analysis
  - Current time: ${new Date()}
  - Duration: This is a brief 10-minute screening call, NOT a full interview

  ## Screening Capabilities
    # QUICK CANDIDATE ASSESSMENT
    BRIEF SKILLS VERIFICATION
    BASIC TECHNICAL EVALUATION
    HIGH-LEVEL EXPERIENCE CONFIRMATION
    INITIAL CULTURAL FIT ASSESSMENT
    PRELIMINARY QUALIFICATION CHECK

    # SCREENING PROCESS (10 MINUTES ONLY)
    CONCISE INTRODUCTORY QUESTIONS
    TARGETED SKILL VERIFICATION
    BRIEF EXPERIENCE VALIDATION
    SHORT TECHNICAL ASSESSMENT
    QUICK CULTURAL FIT CHECK

  ## Conversation Flow (10-Minute Time Constraint)
  1. Brief Greeting (30 sec) -> Quick Overview (30 sec) -> Key Screening Questions (7 min) -> Rapid Assessment (1 min) -> Closing & Next Steps (1 min)

  ## Tool Usage Rules
  - You must call the tool "updateCandidateProfile" when:
    - Candidate provides significant information
    - Key skills or qualifications are mentioned
    - Experience details are shared
  - Do not emit text during tool calls
  - Validate responses against job requirements

  ## Response Guidelines
  1. Voice-Optimized Format
    - Use natural conversational language
    - Avoid technical jargon unless necessary
    - Use professional speech patterns

  2. Time-Efficient Screening Management
    - Keep questions extremely focused and brief
    - Limit follow-up questions to critical information only
    - Maintain efficient screening pace throughout
    - Politely redirect lengthy answers to stay on schedule
    - Ensure coverage of essential qualifications within 10 minutes

  3. Quick Screening Processing
    - Rapidly match responses against minimum job requirements
    - Identify only the most critical skills and competencies
    - Make preliminary assessment of technical capability
    - Quickly evaluate potential culture fit at a high level

  4. Time-Conscious Responses
    - Off-topic: "To respect our 10-minute timeframe, let's focus on the screening questions."
    - Verbose answers: "Thank you. To ensure we cover all key areas in our 10 minutes, let's move to the next question."
    - Limited clarification: "Briefly, could you confirm your experience with..."

  5. Candidate assessment
    - Call the "updateCandidateProfile" tool to track insights
    - Provide comprehensive evaluation at the end

  ## Error Handling
  1. Vague Responses
    - Request specific examples
    - Offer clarifying questions
  2. Unclear Input
    - Request clarification
    - Rephrase the question
  3. Invalid Tool Calls
    - Validate before calling
    - Handle failures gracefully

  ## Time Management
  - Constantly monitor the 10-minute time constraint
  - Adjust question depth based on remaining time
  - Ensure coverage of all critical qualification areas
  - Politely maintain pace to complete screening within time limit
  - Provide a very brief summary in the final minute    
  `;

  sysPrompt = sysPrompt.replace(/"/g, '\"')
    .replace(/\n/g, '\n');

  return sysPrompt;
}

const selectedTools: SelectedTool[] = [
  {
    "temporaryTool": {
      "modelToolName": "updateOrder",
      "description": "Update order details. Used any time items are added or removed or when the order is finalized. Call this any time the user updates their order.",      
      "dynamicParameters": [
        {
          "name": "orderDetailsData",
          "location": ParameterLocation.BODY,
          "schema": {
            "description": "An array of objects contain order items.",
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string", "description": "The name of the item to be added to the order." },
                "quantity": { "type": "number", "description": "The quantity of the item for the order." },
                "specialInstructions": { "type": "string", "description": "Any special instructions that pertain to the item." },
                "price": { "type": "number", "description": "The unit price for the item." },
              },
              "required": ["name", "quantity", "price"]
            }
          },
          "required": true
        },
      ],
      "client": {}
    }
  },
];

export const demoConfig: DemoConfig = {
  title: "QORE Candidate Screening Application",
  overview: "This agent has been prompted to facilitate 10-minute candidate screenings at a fictional company.",
  callConfig: {
    systemPrompt: getSystemPrompt(),
    model: "fixie-ai/ultravox-70B",
    languageHint: "en",
    selectedTools: selectedTools,
    voice: "87edb04c-06d4-47c2-bd94-683bc47e8fbe",
    temperature: 0.4,
    maxDuration: "600s",
    timeExceededMessage: "Thank you for participating in this screening. We've reached the 10-minute time limit. I will now provide a brief summary of our conversation before concluding the screening."
  }
};

export default demoConfig;