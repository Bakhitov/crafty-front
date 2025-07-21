export const PLAYGROUND_API = '/api/v1/playground'
export const AGENTS_API = '/v1/agents'

export const APIRoutes = {
  GetPlaygroundAgents: (PlaygroundApiUrl: string) =>
    `${PlaygroundApiUrl}/v1/agents/detailed`,
  AgentRun: (PlaygroundApiUrl: string) =>
    `${PlaygroundApiUrl}/v1/agents/{agent_id}/runs`,
  PlaygroundStatus: (PlaygroundApiUrl: string) =>
    `${PlaygroundApiUrl}/v1/health`,
  GetPlaygroundSessions: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/agents/${agentId}/sessions`,
  GetPlaygroundSession: (
    PlaygroundApiUrl: string,
    agentId: string,
    sessionId: string
  ) => `${PlaygroundApiUrl}/v1/agents/${agentId}/sessions/${sessionId}`,
  DeletePlaygroundSession: (
    PlaygroundApiUrl: string,
    agentId: string,
    sessionId: string
  ) => `${PlaygroundApiUrl}/v1/agents/${agentId}/sessions/${sessionId}`,

  CreateAgent: (PlaygroundApiUrl: string) => `${PlaygroundApiUrl}/v1/agents`,
  UpdateAgent: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/agents/${agentId}`,
  DeleteAgent: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/agents/${agentId}`,
  GetAgent: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/agents/${agentId}`
}
