import React, { useState, useEffect } from 'react';
import {clusterApiUrl, Connection, PublicKey} from '@solana/web3.js';

const TransactionsList = ({account}) => {
    const [transactions, setTransactions] = useState(null);

    const solScanUrl = 'https://solscan.io';

    useEffect(() => {
        const fetchTransactions = async () => {

            const publicKeyInstance = new PublicKey(account._keypair.publicKey);

            // Establish connection
            const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

            // Get transaction signatures
            const signatures = await connection.getSignaturesForAddress(publicKeyInstance);

            // For each signature, fetch the transaction details
            const transactions = await Promise.all(
                signatures.map(async (sig) => {
                    return await connection.getTransaction(sig.signature);
                })
            );

            if(transactions){
                setTransactions(transactions);
            }

        };

        fetchTransactions();
    }, [account]); // Re-fetch when the account changes

    if (!transactions) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>Transactions</h2>
            <table className="table table-striped overflow-auto">
                <thead>
                <tr>
                    <th>Signature</th>
                    <th>Block</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Value</th>
                    <th>Timestamp</th>
                </tr>
                </thead>
                <tbody>

                {transactions.map(transaction => (
                    <tr key={transaction.transaction.signatures}>
                        <td>
                            <a
                                href={`${solScanUrl}/tx/${transaction.transaction.signatures}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {transaction.transaction.signatures[0].slice(0,6) + '...' + transaction.transaction.signatures[0].slice(-6)}
                            </a>
                        </td>
                        <td>
                            <a
                                href={`${solScanUrl}/block/${transaction.slot}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {transaction.slot}
                            </a>
                        </td>
                        <td>
                            <a
                                href={`${solScanUrl}/address/${transaction.transaction.message.accountKeys[0]}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {transaction.transaction.message.accountKeys[0].toString().slice(0,6) + '...' + transaction.transaction.message.accountKeys[0].toString().slice(-6)}
                            </a>
                        </td>
                        <td>
                        <a
                            href={`${solScanUrl}/address/${transaction.transaction.message.accountKeys[1]}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {transaction.transaction.message.accountKeys[1].toString().slice(0,6) + '...' + transaction.transaction.message.accountKeys[1].toString().slice(-6)}
                        </a>
                        </td>
                        <td>
                            {(transaction.meta.preBalances[0] - transaction.meta.postBalances[0]) / 1000000000}
                        </td>
                        <td>
                            {new Date(transaction.blockTime * 1000).toLocaleString()}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default TransactionsList;