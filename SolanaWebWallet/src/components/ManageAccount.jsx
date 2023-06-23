import React, { useState, useEffect } from 'react';
import {Connection, PublicKey, clusterApiUrl, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Buffer } from 'buffer';
import TransactionsList from './TransactionsList';
function ManageAccount() {

    const [account, setAccount] = useState(null);
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
    const [recoveryInput, setRecoveryInput] = useState('');

    const [balance, setBalance] = useState(0);

    function createAccount() {

        const generatedAccount = Keypair.generate();

        console.log('generatedAccount: ', generatedAccount);

        const publicKey = generatedAccount.publicKey.toString();
        console.log('publicKey: ', publicKey);
        //
        // const secretKey = Buffer.from(generatedAccount.secretKey).toString('hex')
        // console.log('secretKey: ', secretKey)

        setAccount({
            ...generatedAccount
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

        setAccount({
            ...recoveredAccount
        })
    }

    function hexToUint8Array(hexString) {
        return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    }

    function Uint8ArrayToHex(uint8Array) {
        const hexString = Buffer.from(uint8Array).toString('hex')

        console.log('hexString: ', hexString);

        return hexString
    }

    const getBalance = async () => {

        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
        console.log('connection: ', connection)

        const publicKeyInstance = new PublicKey(account._keypair.publicKey);
        console.log('publicKeyInstance: ', publicKeyInstance);


        const balance = await connection.getBalance(publicKeyInstance);
        console.log('balance: ', balance);

        setBalance(()=> balance / LAMPORTS_PER_SOL);
    }

    const airdropSol = async () => {

        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
        console.log('connection: ', connection)

        const publicKeyInstance = new PublicKey(account._keypair.publicKey);
        console.log('publicKeyInstance: ', publicKeyInstance);

        const fromAirdropSignature = await connection.requestAirdrop(publicKeyInstance, 1 * LAMPORTS_PER_SOL);

        await connection.confirmTransaction(fromAirdropSignature);

        getBalance();

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
            <div>
                {account !== null ? <p>Public Key: {Uint8ArrayToHex(account._keypair.publicKey)}</p> : null}
            </div>

            {
                account !== null
                &&
                <button onClick={toggleSecretKey}>
                    {showSecretKey ? 'Hide' : 'Show'} Secret Key
                </button>
            }
            {showSecretKey && account !== null && <p>Secret Key: {Uint8ArrayToHex(account._keypair.secretKey)}</p>}
            <div className='account-balance-div'>
                <button onClick={getBalance}>Get Balance</button>
                <p>Balance: {balance}</p>
            </div>
            <div className='airdrop-div'>
                <button onClick={airdropSol}>Airdrop SOL</button>
            </div>

        </div>
    )
}

export default ManageAccount;