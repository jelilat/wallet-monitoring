import { RpcProvider } from 'starknet'
import { mailjetRequest } from './email';
import { keccak256 } from 'js-sha3';
import { config } from 'dotenv';
config();

const CONTRACT_ADDRESS = "0x0726ba7b6f93fa6724b91e9455978e8e695960c727978364d2c0509882cdbb3b";

export const provider = new RpcProvider({
  nodeUrl: process.env.STARKNET_NODE_URL!
});

const listenToEvents = async (lastBlockNumber: number) => {
    let continuationToken: string | undefined;
    let lastTransactionHash: string | undefined;

    while (true) {
        const event = await provider.getEvents({
            continuation_token: continuationToken,
            from_block: {
                block_number: lastBlockNumber,
            },
            to_block: "latest" as any,
            address: CONTRACT_ADDRESS,
            keys: [[stringToHexFelt("transaction_executed")]],
            chunk_size: 1000,
        })
        continuationToken = event.continuation_token;
        
        for await (const item of event.events) {
            const transactionHash = item.transaction_hash;
            // avoid resending notification for the same transaction
            if (transactionHash != lastTransactionHash) {
                console.log('New transaction detected:', transactionHash)
                // send transaction to email
                mailjetRequest(transactionHash)
                    .then((result) => {
                        console.log(result.body)
                    })
                    .catch((err) => {
                        console.log(err.statusCode)
                    })
            }
        }

        if (!continuationToken) {
            break;
        }
    }
}

const getLatestBlockNumber = async () => {
    const block = await provider.getBlock("latest");
    return block.block_number;
}

export function stringToHexFelt (name: string): string {
    // Compute the Keccak-256 hash of the name encoded in ASCII
    const nameHash = keccak256.array(name);

    // Get the last 250 bits of the hash
    const last250Bits = nameHash.slice(-31).reverse();

    // Convert the bytes to a bigint
    let selectorInt = 0n;
    for (let i = 0; i < last250Bits.length; i++) {
        selectorInt |= BigInt(last250Bits[i]) << BigInt(i * 8);
    }

    return "0x" + selectorInt.toString(16);
}

const main = async () => {
    let lastBlockNumber = 0
    while (true) {
        try {
            const latestBlockNumber = await getLatestBlockNumber()
            console.log('Latest block number:', latestBlockNumber)
            if (latestBlockNumber > lastBlockNumber) {
                await listenToEvents(latestBlockNumber)
                // Update lastBlockNumber only after listenToEvents has executed successfully
                lastBlockNumber = latestBlockNumber
            }
        } catch (error) {
            console.error('Failed to fetch latest block number or listen to events:', error)
        }

        await new Promise(resolve => setTimeout(resolve, 30000));
    }
}

main().catch(console.error)


