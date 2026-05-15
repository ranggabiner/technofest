import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonAmoy } from "viem/chains";

const artifactPath = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  "artifacts",
  "contracts",
  "MedProofProofRegistry.sol",
  "MedProofProofRegistry.json",
);

async function main() {
  const rpcUrl = requiredEnv("AMOY_RPC_URL");
  const privateKey = requiredEnv("RELAYER_PRIVATE_KEY") as Hex;
  const artifact = JSON.parse(await fs.readFile(artifactPath, "utf8")) as {
    abi: unknown[];
    bytecode: Hex;
  };
  const account = privateKeyToAccount(privateKey);
  const transport = http(rpcUrl);
  const publicClient = createPublicClient({
    chain: polygonAmoy,
    transport,
  });
  const walletClient = createWalletClient({
    account,
    chain: polygonAmoy,
    transport,
  });

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    account,
    chain: polygonAmoy,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

  if (!receipt.contractAddress) throw new Error("Deployment receipt did not include contract address");

  console.log(`MEDPROOF_CONTRACT_ADDRESS=${receipt.contractAddress}`);
  console.log(`DEPLOY_TX_HASH=${hash}`);
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
