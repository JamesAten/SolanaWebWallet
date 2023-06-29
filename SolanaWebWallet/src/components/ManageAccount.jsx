import React, { useState, useEffect } from 'react';
import {Connection, PublicKey, clusterApiUrl, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import * as buffer from "buffer";
import bs58 from 'bs58';
import TransactionsList from './TransactionsList';

window.Buffer = buffer.Buffer;
function ManageAccount() {

    const [account, setAccount] = useState(null);
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
    const [recoveryInput, setRecoveryInput] = useState('');

    const [balance, setBalance] = useState(0);

    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');

    function createAccount() {

        const generatedAccount = Keypair.generate();

        console.log('generatedAccount: ', generatedAccount);

        const publicKey = generatedAccount.publicKey.toString();
        console.log('publicKey: ', publicKey);

        setAccount({
            ...generatedAccount
        })
    }

    function recoverAccount(secret) {
        // console.log('submitted Secret Key: ', secret);

        const secretToUint8Array = hexToUint8Array(secret);
        console.log('secretToUint8Array: ', secretToUint8Array);

        const seed = secretToUint8Array.slice(0, 32);

        const recoveredAccount = Keypair.fromSeed(seed);
        console.log('recoveredAccount: ', recoveredAccount);

        const publicKey = recoveredAccount.publicKey.toString();
        console.log('recoveredAccount.publicKey: ', publicKey);

        console.log('accountBefore: ', account )

        setAccount({
            ...recoveredAccount
        })

        console.log('accountAfter: ', account)
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
        recoverAccount(recoveryInput);
    }

    function hexToUint8Array(hexString) {
        return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    }

    function Uint8ArraySecretKeyToHex(uint8Array) {
        const hexString = Buffer.from(uint8Array).toString('hex');
        return hexString;
    }

    function Uint8ArrayPublicKeyToString(uint8Array) {
        const publicKeyArray = Array.from(uint8Array);
        const publicKeyString = bs58.encode(Uint8Array.from(publicKeyArray));
        return publicKeyString;
    }

    const getBalance = async () => {

        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
        // console.log('connection: ', connection)

        const publicKeyInstance = new PublicKey(account._keypair.publicKey);
        // console.log('publicKeyInstance: ', publicKeyInstance);


        const balance = await connection.getBalance(publicKeyInstance);
        // console.log('balance: ', balance);

        setBalance(()=> balance / LAMPORTS_PER_SOL);
    }

    const airdropSol = async () => {

        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
        // console.log('connection: ', connection)

        const publicKeyInstance = new PublicKey(account._keypair.publicKey);
        // console.log('publicKeyInstance: ', publicKeyInstance);

        const fromAirdropSignature = await connection.requestAirdrop(publicKeyInstance, 1 * LAMPORTS_PER_SOL);

        await connection.confirmTransaction(fromAirdropSignature);

        getBalance();

    }

    const handleRecipientAddressChange = (e) => {
        setRecipientAddress(e.target.value);
    };

    const handleAmountChange = (e) => {
        setAmount(e.target.value);
    };

    const handleSendSolana = async () => {
        const fromPubKey = new PublicKey(Uint8ArrayPublicKeyToString(account._keypair.publicKey));
        console.log('fromPubKey: ', fromPubKey);

        const fromPrivateKey = Keypair.fromSecretKey(account._keypair.secretKey);

        const tx = new Transaction().add(SystemProgram.transfer({
            fromPubkey: fromPubKey,
            /** Account that will receive transferred lamports */
            toPubkey: new PublicKey(recipientAddress),
            /** Amount of lamports to transfer */
            lamports: amount * LAMPORTS_PER_SOL,
        }));

        const connection = new Connection(clusterApiUrl("devnet"), 'confirmed');

        const blockHash = (await connection.getLatestBlockhash('finalized')).blockhash;

        tx.feePayer = fromPubKey;

        tx.recentBlockhash = blockHash;

        const serializedTransaction = tx.serialize({ requireAllSignatures: false, verifySignatures: true });

        const transactionBase64 = serializedTransaction.toString('base64');

        const feePayer = fromPrivateKey;

        const recoveredTransaction = Transaction.from(Buffer.from(transactionBase64, 'base64'));

        recoveredTransaction.partialSign(feePayer);

        const txnSignature = await connection.sendRawTransaction(
            recoveredTransaction.serialize(),
        );

        return txnSignature;
    }

    useEffect(() => {
        if(account !== null){
            getBalance();
        }
        if(account){
            console.log('useEffectAccount: ', account.publicKey);
        }


    }, [account])

    return (
        <div className="manage-account-div container">
            <button className="btn btn-success rounded-pill px-3" onClick={createAccount}>Create Account</button>

            <button className="btn btn-warning rounded-pill px-3" onClick={toggleRecoverAccount}>{showRecoveryOptions ? 'Hide' : 'Show'} Recovery Options</button>

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
                        <button className="btn btn-warning rounded-pill px-3" onClick={handleRecoveryInputSubmit}>Recover Account</button>
                    </div>
                )
            }

            <hr>
            </hr>

            <h2>Account</h2>
            <div>
                {account !== null ? <p>Public Key: {Uint8ArrayPublicKeyToString(account._keypair.publicKey)}</p> : null}
            </div>

            {
                account !== null
                &&
                <button
                    className="btn btn-warning rounded-pill px-3"
                    onClick={toggleSecretKey}
                >
                    {showSecretKey ? 'Hide' : 'Show'} Secret Key
                </button>
            }

            {showSecretKey && account !== null && <p>Secret Key: {Uint8ArraySecretKeyToHex(account._keypair.secretKey)}</p>}

            <div className='account-balance-div'>
                <button className="btn btn-info rounded-pill px-3" onClick={getBalance}>Get Balance</button>
                <p>Balance: {balance}</p>
            </div>

            <div className='airdrop-div'>
                <button className="btn btn-info rounded-pill px-3" onClick={airdropSol}>Airdrop SOL</button>
            </div>

            <hr>
            </hr>

            <div className={'send-sol-div'}>
                <h2>Send SOL</h2>
                <div>
                    <label>Recipient Address: </label>
                    <input type="text" value={recipientAddress} onChange={handleRecipientAddressChange} />
                </div>
                <div>
                    <label>Amount: </label>
                    <input type="number" value={amount} onChange={handleAmountChange} />
                </div>
                <button className="btn btn-primary rounded-pill px-3" onClick={handleSendSolana}>Send SOL</button>
            </div>

            <hr>
            </hr>

            {account !== null && <TransactionsList account={account} />}

        </div>
    )
}

export default ManageAccount;