export interface Settings {
  startWithFrontCamera: boolean;
  maxParentConnections: number;
  pollingTimeout: number;
  restartPolling: boolean;
  usePushToTalk: boolean;
  trustedParents: number[];
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
