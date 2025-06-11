use base64::{engine::general_purpose, Engine as _};
use borsh::{BorshDeserialize, BorshSerialize};
use substreams_solana::block_view::InstructionView;

pub const SPL_TOKEN_PROGRAM_ID: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
pub const SPL_TOKEN_2022_PROGRAM_ID: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

pub const SPL_PROGRAMS: [&str; 2] = [SPL_TOKEN_PROGRAM_ID, SPL_TOKEN_2022_PROGRAM_ID];

#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct SPLTransfer {
    pub amount: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct SPLTransferChecked {
    pub amount: u64,
    pub decimals: u8,
}

pub fn get_anchor_logs(instruction: &InstructionView) -> Vec<Vec<u8>> {
    let meta = instruction.meta();
    let mut decoded: Vec<Vec<u8>> = Vec::new();

    for log in &meta.log_messages {
        if log.starts_with("Program data: ") {
            if let Some(encoded_data) = log.strip_prefix("Program data: ") {
                if let Ok(data) = general_purpose::STANDARD.decode(encoded_data) {
                    decoded.push(data);
                }
            }
        }
    }

    return decoded;
}

pub fn get_transfer(instruction: &InstructionView) -> Option<(String, String, String, String, String, u64)> {
    let accounts = instruction.accounts();
    let data = instruction.data();

    let (discriminator_bytes, rest) = data.split_at(1);
    let discriminator: u8 = u8::from(discriminator_bytes[0]);

    match discriminator {
        3 => {
            let from = accounts.get(0).unwrap().to_string();
            let to = accounts.get(1).unwrap().to_string();
            let from_owner: String = accounts.get(2).unwrap().to_string();

            if let Some((to_owner, nft_mint)) = get_transfer_entities(instruction, from_owner.clone()) {
                if rest.len() > 8 {
                    let (rest_split, _) = rest.split_at(8);
                    let amount = SPLTransfer::try_from_slice(rest_split).unwrap().amount;

                    if amount == 1 {
                        return Some((from, to, from_owner, to_owner, nft_mint, amount));
                    }
                } else {
                    let amount = SPLTransfer::try_from_slice(rest).unwrap().amount;
                    if amount == 1 {
                        return Some((from, to, from_owner, to_owner, nft_mint, amount));
                    }
                }
            }

            None
        }
        12 => {
            let from = accounts.get(0).unwrap().to_string();
            let to = accounts.get(2).unwrap().to_string();
            let from_owner = accounts.get(3).unwrap().to_string();

            if let Some((to_owner, nft_mint)) = get_transfer_entities(instruction, from_owner.clone()) {
                let amount = SPLTransferChecked::try_from_slice(rest).unwrap().amount;

                if amount == 1 {
                    return Some((from, to, from_owner, to_owner, nft_mint, amount));
                }
            }

            None
        }
        _ => None,
    }
}

pub fn get_transfer_entities(instruction: &InstructionView, from_owner: String) -> Option<(String, String)> {
    let pre_balances = &instruction.meta().pre_token_balances;
    let post_balances = &instruction.meta().post_token_balances;

    let pre_balance_from = pre_balances.iter().find(|balance| {
        balance.owner.to_string() == from_owner
            && !balance.ui_token_amount.is_none()
            && balance.ui_token_amount.clone().unwrap().amount.to_string() == "1"
    });

    if pre_balance_from.is_none() {
        return None;
    }

    let nft_mint = pre_balance_from.unwrap().mint.to_string();

    let post_balance_to = post_balances.iter().find(|balance| {
        balance.mint.to_string() == nft_mint
            && !balance.ui_token_amount.is_none()
            && balance.ui_token_amount.clone().unwrap().amount.to_string() == "1"
    });

    if post_balance_to.is_none() {
        return None;
    }

    let to_owner = post_balance_to.unwrap().owner.to_string();

    Some((to_owner, nft_mint))
} 