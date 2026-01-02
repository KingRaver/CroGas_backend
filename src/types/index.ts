// Exact Zod + Express types for zero runtime errors

export interface FaucetRequest {
  address: `0x${string}`;
}

export interface FaucetResponse {
  hash: `0x${string}`;
  amount: number;  // USD
  message: string;
}

export interface X402Request {
  typedData: {
    domain: {
      name: string;
      version: string;
      chainId: number;
      verifyingContract: `0x${string}`;
    };
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: 'AuthorizationTransfer';
    message: {
      from: `0x${string}`;
      to: `0x${string}`;
      value: bigint;
      nonce: `0x${string}`;
      deadline: bigint;
    };
  };
  signature: `0x${string}`;
  targetTx: {
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
  };
}

export interface X402Response {
  authHash: `0x${string}`;
  relayHash: `0x${string}`;
  gasUsed: bigint;
  gasCostUSD: number;
}