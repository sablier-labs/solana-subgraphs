#[path = "./generated/constants.rs"]
mod constants;
mod generated;
mod idl;

use anchor_lang::AnchorDeserialize;
use anchor_lang::Discriminator;
use sablier_packages_substream as util;
use substreams_solana::block_view::InstructionView;
use substreams_solana::pb::sf::solana::r#type::v1::Block;

use generated::substreams::v1::program::{Claim, Clawback, Create, Data};
use idl::idl::merkle_instant_v10::{client::args as merkle_instant_v10_methods, events as merkle_instant_v10_events};

fn handle_claim(index: usize, instruction: &InstructionView) -> Option<Claim> {
    let slice_u8: &[u8] = &instruction.data()[..];

    if let Ok(arguments) = merkle_instant_v10_methods::Claim::deserialize(&mut &slice_u8[8..]) {
        let accounts = instruction.accounts();

        let logs = util::get_anchor_logs(instruction);

        let mut leaf_amount: u64 = 0;
        let mut leaf_index: u64 = 0;
        let mut leaf_receipt: String = String::new();
        let mut decimals: u32 = 0;

        for log in logs {
            if log[0..8] == merkle_instant_v10_events::Claimed::DISCRIMINATOR {
                if let Ok(event) = merkle_instant_v10_events::Claimed::deserialize(&mut &log[8..]) {
                    leaf_amount = event.amount;
                    leaf_index = event.index as u64;
                    leaf_receipt = event.claim_receipt.to_string();
                    decimals = 9; // TODO replace with event decimals in future versions
                }
            }
        }

        Some(Claim {
            instruction_program: instruction.program_id().to_string(),
            instruction_index: index as u64,
            transaction_hash: instruction.transaction().id(),

            index: leaf_index,
            amount: leaf_amount,
            merkle_proof: arguments
                .merkle_proof
                .iter()
                .map(|proof| format!("0x{}", proof.iter().map(|b| format!("{:02x}", b)).collect::<String>()))
                .collect(),

            claimer: accounts[0].to_string(),
            campaign: accounts[1].to_string(),
            campaign_ata: accounts[4].to_string(),

            recipient: accounts[5].to_string(),
            recipient_ata: accounts[6].to_string(),
            receipt: leaf_receipt,

            airdrop_token_mint: accounts[2].to_string(),
            airdrop_token_program: accounts[9].to_string(),
            airdrop_token_decimals: decimals, // TODO replace with event decimals in future versions
        })
    } else {
        None
    }
}

fn handle_clawback(index: usize, instruction: &InstructionView) -> Option<Clawback> {
    let slice_u8: &[u8] = &instruction.data()[..];

    if let Ok(arguments) = merkle_instant_v10_methods::Clawback::deserialize(&mut &slice_u8[8..]) {
        let accounts = instruction.accounts();

        Some(Clawback {
            instruction_program: instruction.program_id().to_string(),
            instruction_index: index as u64,
            transaction_hash: instruction.transaction().id(),

            creator: accounts[0].to_string(),
            campaign: accounts[1].to_string(),
            campaign_ata: accounts[3].to_string(),

            amount: arguments.amount,

            airdrop_token_mint: accounts[2].to_string(),
            airdrop_token_program: accounts[5].to_string(),
            airdrop_token_decimals: 9, // TODO replace with event decimals in future versions
        })
    } else {
        None
    }
}

fn handle_create(index: usize, instruction: &InstructionView) -> Option<Create> {
    let slice_u8: &[u8] = &instruction.data()[..];

    if let Ok(arguments) = merkle_instant_v10_methods::CreateCampaign::deserialize(&mut &slice_u8[8..]) {
        let accounts = instruction.accounts();

        let logs = util::get_anchor_logs(instruction);

        let mut decimals: u32 = 0;

        for log in logs {
            if log[0..8] == merkle_instant_v10_events::CampaignCreated::DISCRIMINATOR {
                if let Ok(_event) = merkle_instant_v10_events::CampaignCreated::deserialize(&mut &log[8..]) {
                    decimals = 9 // TODO replace with event decimals in future versions;
                }
            }
        }

        Some(Create {
            instruction_program: instruction.program_id().to_string(),
            instruction_index: index as u64,
            transaction_hash: instruction.transaction().id(),

            merkle_root: format!(
                "0x{}",
                arguments.merkle_root.iter().map(|b| format!("{:02x}", b)).collect::<String>()
            ),
            expiration: arguments.expiration_time as u64,
            ipfs_cid: arguments.ipfs_id,
            name: arguments.name,
            aggregated_amount: arguments.aggregate_amount,
            recipient_count: arguments.recipient_count as u64,

            creator: accounts[0].to_string(),
            campaign: accounts[2].to_string(),
            campaign_ata: accounts[3].to_string(),

            airdrop_token_mint: accounts[1].to_string(),
            airdrop_token_program: accounts[5].to_string(),
            airdrop_token_decimals: decimals,
        })
    } else {
        None
    }
}

#[substreams::handlers::map]
fn map_program_data(block: Block) -> Data {
    let watched_programs: Vec<&str> = constants::cluster::SABLIER_MERKLE_INSTANT_V10.iter().copied().collect();

    let mut claim_list: Vec<Claim> = Vec::new();
    let mut clawback_list: Vec<Clawback> = Vec::new();
    let mut create_list: Vec<Create> = Vec::new();

    let block_number = block.block_height.as_ref().map_or(0, |h| h.block_height);
    let block_timestamp = block.block_time.as_ref().map_or(0, |t| t.timestamp);

    block.transactions().for_each(|transaction| {
        // ------------- TRANSACTIONS -------------
        transaction
            .walk_instructions()
            .into_iter()
            .enumerate()
            .filter(|(_, instruction)| watched_programs.contains(&instruction.program_id().to_string().as_str()))
            .for_each(|(index, instruction)| {
                // ------------- INSTRUCTIONS -------------

                let slice_u8: &[u8] = &instruction.data()[..];
                if slice_u8[0..8] == merkle_instant_v10_methods::Claim::DISCRIMINATOR {
                    let entry = handle_claim(index, &instruction);
                    if let Some(_) = entry {
                        claim_list.push(entry.unwrap());
                    }
                } else if slice_u8[0..8] == merkle_instant_v10_methods::Clawback::DISCRIMINATOR {
                    let entry = handle_clawback(index, &instruction);
                    if let Some(_) = entry {
                        clawback_list.push(entry.unwrap());
                    }
                } else if slice_u8[0..8] == merkle_instant_v10_methods::CreateCampaign::DISCRIMINATOR {
                    let entry = handle_create(index, &instruction);
                    if let Some(_) = entry {
                        create_list.push(entry.unwrap());
                    }
                }
            });
    });

    Data { claim_list, clawback_list, create_list, block_number, block_timestamp }
}
