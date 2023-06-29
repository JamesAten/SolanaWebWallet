use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    program_error::ProgramError,
    program_pack::{Pack, IsInitialized},
};

use spl_token::state::Account as TokenAccount;

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let owner = next_account_info(accounts_iter)?;
    let sender = next_account_info(accounts_iter)?;
    let recipient = next_account_info(accounts_iter)?;
    let token_account = next_account_info(accounts_iter)?;

    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let sender_stipend = get_stipend(&sender)?;

    if !sender_stipend.is_initialized() {
        return Err(ProgramError::UninitializedAccount);
    }

    if !is_allowed_to_send(&sender)? {
        return Err(ProgramError::Custom(1)); // Custom error code for unauthorized sender
    }

    let amount = u64::from_le_bytes(*array_ref![instruction_data, 0, 8]);

    if sender_stipend.amount < amount {
        return Err(ProgramError::Custom(2)); // Custom error code for insufficient stipend
    }

    let transfer_authority_info = next_account_info(accounts_iter)?;

    let mut token_account_data = TokenAccount::unpack_unchecked(&token_account.data.borrow())?;
    if token_account_data.amount < amount {
        return Err(ProgramError::Custom(3)); // Custom error code for insufficient token balance
    }

    token_account_data.amount -= amount;
    TokenAccount::pack(token_account_data, &mut token_account.data.borrow_mut())?;

    **recipient.lamports.borrow_mut() += amount;

    sender_stipend.amount -= amount;
    Stipend::pack(sender_stipend, &mut sender.data.borrow_mut())?;

    Ok(())
}

#[derive(Debug, Default, PartialEq)]
pub struct Stipend {
    pub is_initialized: bool,
    pub amount: u64,
}

impl Pack for Stipend {
    const LEN: usize = 9;

    fn pack_into_slice(&self, dst: &mut [u8]) {
        dst[0] = self.is_initialized as u8;
        dst[1..9].copy_from_slice(&self.amount.to_le_bytes());
    }

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        Ok(Stipend {
            is_initialized: src[0] != 0,
            amount: u64::from_le_bytes(*array_ref![src, 1, 8]),
        })
    }
}

impl IsInitialized for Stipend {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

fn get_stipend(account: &AccountInfo) -> Result<Stipend, ProgramError> {
    let stipend_data = &account.data.borrow();
    Stipend::unpack(&stipend_data)
        .map_err(|_| ProgramError::InvalidAccountData)
}

fn is_allowed_to_send(account: &AccountInfo) -> Result<bool, ProgramError> {
    let is_allowed_data = &account.data.borrow();
    let is_allowed = bool::unpack(&is_allowed_data)
        .map