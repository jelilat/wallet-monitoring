import Mailjet from 'node-mailjet';

const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC!,
    process.env.MJ_APIKEY_PRIVATE!,
);

export const mailjetRequest = async (transactionHash: string) => {
    const response = await mailjet
        .post('send', { version: 'v3.1' })
        .request({
            Messages: [
                {
                    From: {
                        Email: "wallet-monitor@nethermind.io",
                        Name: "Wallet Monitor"
                    },
                    To: [
                        {
                            Email: "user@starknet.com",
                            Name: "user"
                        }
                    ],
                    Subject: "Alert: New Transaction Detected on Your Wallet",
                    TextPart: `Dear User, \n\nWe have detected a new transaction on your StarkNet wallet. You can view the details of this transaction on Voyager by following this link: \n\nhttps://voyager.online/tx/${transactionHash} \n\nPlease review this transaction carefully. If you did not initiate this transaction, it may indicate that your private keys have been compromised. Ensure that your keys are stored securely and consider moving your funds to a new wallet if you suspect any foul play. \n\nStay Safe, \nWallet Monitor`,
                    HTMLPart: `<p>Dear User,</p><p>We have detected a new transaction on your StarkNet wallet. You can view the details of this transaction on <a href="https://voyager.online/tx/${transactionHash}">Voyager</a>.</p><p>Please review this transaction carefully. If you did not initiate this transaction, it may indicate that your private keys have been compromised. Ensure that your keys are stored securely and consider moving your funds to a new wallet if you suspect any foul play.</p><p>Stay Safe,<br/>Wallet Monitor</p>`
                }
            ]
        })

    return response;
}


