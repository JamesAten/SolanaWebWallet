import React, { useState, useEffect } from 'react';
import {Connection, PublicKey, clusterApiUrl, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Buffer } from 'buffer';
import TransactionsList from './TransactionsList';
function ManageAccount() {

    const [account, setAccount] = useState({});
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
    const [recoveryInput, setRecoveryInput] = useState('');

    const [balance, setBalance] = useState(0);

    function createAccount() {

        const generatedAccount = Keypair.generate();

        console.log('generatedAccount: ', generatedAccount);

        const publicKey = generatedAccount.publicKey.toString();
        console.log('publicKey: ', publicKey);

        const secretKey = Buffer.from(generatedAccount.secretKey).toString('hex')
        console.log('secretKey: ', secretKey)

        setAccount({
            publicKey: publicKey,
            secretKey: secretKey
        })
    }

    function recoverAccount(secret) {
        console.log('submitted Secret Key: ', secret);

        const secretToUint8Array = hexToUint8Array(secret);
        console.log('secretToUint8Array: ', secretToUint8Array);

        const seed = secretToUint8Array.slice(0, 32);

        const recoveredAccount = Keypair.fromSeed(seed);

        return recoveredAccount;
    }

    function toggleRecoverAccount () {
        setShowRecoveryOptions(!showRecoveryOptions);
    }

    function toggleSecretKey() {
        setShowSecretKey(!showSecretKey);
    }

    function handleRecoveryInputChange(e) {
        setRecoveryInput(e.target.value);
    }

    function handleRecoveryInputSubmit() {

        const recoveredAccount = recoverAccount(recoveryInput);

        const publicKey = recoveredAccount.publicKey.toString();

        const secretKey = Buffer.from(recoveredAccount.secretKey).toString('hex')

        setAccount({
            publicKey: publicKey,
            secretKey: secretKey
        })
    }

    function hexToUint8Array(hexString) {
        return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    }

    const getBalance = async () => {

        const recoveredAccount = recoverAccount(account.secretKey);

        console.log('recoveredAccount: ', recoveredAccount);

        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
        console.log('connection: ', connection)

        const balance = await connection.getBalance(recoveredAccount.publicKey);
        console.log('balance: ', balance);

        setBalance(()=> balance / LAMPORTS_PER_SOL);
    }

    const airdropSol = async () => {
        console.log('airdropping sol');

        const recoveredAccount = recoverAccount(account.secretKey);

        console.log('recoveredAccount: ', recoveredAccount);

        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
        console.log('connection: ', connection)

        const fromAirdropSignature = await connection.requestAirdrop(recoveredAccount.publicKey, 1 * LAMPORTS_PER_SOL);

        await connection.confirmTransaction(fromAirdropSignature);

        getBalance();

    }

    function getPublicKey(secret){

        console.log('secret: ', secret);

        const recoveredAccount = recoverAccount(secret);

        console.log(recoveredAccount.publicKey);
    }

    return (
        <div className="manage-account-div">
            <button onClick={createAccount}>Create Account</button>

            <button onClick={toggleRecoverAccount}>{showRecoveryOptions ? 'Hide' : 'Show'} Recovery Options</button>

            {
                showRecoveryOptions
                &&
                (
                    <div>
                        <input
                            type={'text'}
                            placeholder={'Enter Secret Key'}
                            value={recoveryInput}
                            onChange={handleRecoveryInputChange}
                        />
                        <button onClick={handleRecoveryInputSubmit}>Recover Account</button>
                    </div>
                )
            }

            <h2>Account</h2>
            <p>Public Key: {account.publicKey}</p>

            {
                account.publicKey
                &&
                <button onClick={toggleSecretKey}>
                    {showSecretKey ? 'Hide' : 'Show'} Secret Key
                </button>
            }
            {showSecretKey && <p>Secret Key: {account.secretKey}</p>}
            <div className='account-balance-div'>
                <button onClick={getBalance}>Get Balance</button>
                <p>Balance: {balance}</p>
            </div>
            <div className='airdrop-div'>
                <button onClick={airdropSol}>Airdrop SOL</button>
            </div>
            <button onClick={() => {getPublicKey(account.secretKey)}}>Get Public Key</button>

        </div>
    )
}

export default ManageAccount;