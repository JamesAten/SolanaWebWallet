import React, { useState, useEffect } from 'react';
import {clusterApiUrl, Connection, PublicKey} from '@solana/web3.js';

const TransactionsList = ({publicKey}) => {
    const [transactions, setTransactions] = useState(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            // Establish connection
            const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

            // Convert public key into PublicKey object
            const publicKeyObj = new PublicKey(publicKey);

            // Get transaction signatures
            const signatures = await connection.getConfirmedSignaturesForAddress2(publicKeyObj);

            // For each signature, fetch the transaction details
            const transactions = await Promise.all(
                signatures.map(async (sig) => {
                    return await connection.getConfirmedTransaction(sig.signature);
                })
            );

            setTransactions(transactions);
        };

        fetchTransactions();
    }, [publicKey]); // Refetch when the public key changes

    if (!transactions) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {transactions.map((transaction, i) => (
                <div key={i}>
                    <h3>Transaction {i + 1}</h3>
                    <pre>{JSON.stringify(transaction, null, 2)}</pre>
                </div>
            ))}
        </div>
    );
}

export default TransactionsList;