import { NextResponse, NextRequest } from 'next/server';

interface UltravoxCallRequest {
  systemPrompt: string;
  model?: string;
  voice?: string;
  languageHint?: string;
  initialMessages?: any[];
  joinTimeout?: string;
  maxDuration?: string;
  timeExceededMessage?: string;
  selectedTools?: any[];
  medium: {
    webRtc?: Record<string, any>;
  };
  recordingEnabled?: boolean;
  firstSpeaker?: string;
  transcriptOptional?: boolean;
  initialOutputMedium?: string;
  firstSpeakerSettings?: any;
  experimentalSettings?: any;
  metadata?: Record<string, any>;
  initialState?: any;
  dataConnection?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Attempting to call Ultravox API...');
    
    // Prepare tools configuration
    const tools = body.selectedTools ? body.selectedTools.map((tool: any) => {
      if (tool.temporaryTool) {
        // Update parameter locations for the tool
        const updatedTool = { ...tool };
        if (updatedTool.temporaryTool.dynamicParameters) {
          updatedTool.temporaryTool.dynamicParameters = updatedTool.temporaryTool.dynamicParameters.map((param: any) => {
            if (param.name === 'callId' && param.location === 'PARAMETER_LOCATION_QUERY') {
              return {
                ...param,
                location: 4 // BODY location
              };
            }
            return param;
          });
        }
        return updatedTool;
      }
      return tool;
    }) : [];

    // Prepare the request payload according to Ultravox API requirements
    const payload: UltravoxCallRequest = {
      systemPrompt: body.systemPrompt || '',
      model: body.model,
      voice: body.voice,
      languageHint: body.languageHint || 'en',
      initialMessages: body.initialMessages || [],
      maxDuration: body.maxDuration || '300s',
      recordingEnabled: body.recordingEnabled !== undefined ? body.recordingEnabled : true,
      medium: {
        webRtc: {}
      },
      // Include tools if any
      ...(tools.length > 0 && { selectedTools: tools }),
      // Copy other fields that might be needed
      ...(body.timeExceededMessage && { timeExceededMessage: body.timeExceededMessage }),
      ...(body.firstSpeakerSettings && { firstSpeakerSettings: body.firstSpeakerSettings }),
      ...(body.metadata && { metadata: body.metadata })
    };

    console.log('Sending payload to Ultravox API:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('https://api.ultravox.ai/api/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ULTRAVOX_API_KEY || '',
      },
      body: JSON.stringify(payload),
    });

    console.log('Ultravox API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ultravox API error:', errorText);
      throw new Error(`Ultravox API error: ${response.status}, ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in API route:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error calling Ultravox API', details: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'An unknown error occurred.' },
        { status: 500 }
      );
    }
  }
}