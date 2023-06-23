import React from 'react';

function CreateWallet() {

    console.log('test');

    function createWallet() {
        console.log('create wallet');
    }

    function recoverWallet () {
        console.log('recover wallet');
    }

    return (
        <div className="createwallet">
            <button onClick={createWallet}>Create Wallet</button>
            <button onClick={recoverWallet}>Recover Wallet</button>
        </div>
    )
}

export default CreateWallet;