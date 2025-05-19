import { ClientToolImplementation } from 'ultravox-client';

// Client-implemented tool for Candidate Profile
export const updateCandidateProfileTool: ClientToolImplementation = (parameters) => {
  const { candidateData, callId } = parameters;
  console.debug("Received candidate profile update:", candidateData, "for call ID:", callId);

  if (typeof window !== "undefined") {
    const event = new CustomEvent("candidateProfileUpdated", {
      detail: {
        candidateData,
        callId
      },
    });
    window.dispatchEvent(event);
  }

  return "Updated candidate profile with assessment information.";
};