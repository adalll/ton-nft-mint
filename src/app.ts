import * as dotenv from "dotenv";
import { encodeOffChainContent, OpenedWallet, openWallet } from "./utils";
import { readdir } from "fs/promises";
import { updateMetadataFiles, uploadFolderToIPFS } from "./metadata";

import { waitSeqno } from './delay'
import { Address, beginCell, Cell, contractAddress, internal, SendMode, StateInit, toNano } from 'ton-core'
import { NftCollection } from './contracts/nft-collection'
import { NftItem } from './contracts/nft-item'

dotenv.config();

async function init() {
    const wallet = await openWallet(process.env.MNEMONIC!.split(" "), true);
    console.log(await wallet.contract.getBalance())

    console.log(wallet.keyPair.secretKey.toString('hex'))

    const metadataFolderPath = "./data/metadata/";
    const imagesFolderPath = "./data/images/";

    // const wallet = await openWallet(process.env.MNEMONIC!.split(" "), true);
    //
    // console.log("Started uploading images to IPFS...");
    //
    // const imagesIpfsHash = await uploadFolderToIPFS(imagesFolderPath);
    // console.log(
    //     `Successfully uploaded the pictures to ipfs: https://gateway.pinata.cloud/ipfs/${imagesIpfsHash}`
    // );
    //
    // console.log("Started uploading metadata files to IPFS...");
    // await updateMetadataFiles(metadataFolderPath, imagesIpfsHash);
    // const metadataIpfsHash = await uploadFolderToIPFS(metadataFolderPath);
    // console.log(
    //     `Successfully uploaded the metadata to ipfs: https://gateway.pinata.cloud/ipfs/${metadataIpfsHash}`
    // );
    const metadataIpfsHash = 'QmbeNtTJXxZ5Lp5shgP1VYmFJx9eYieS586szLMotE2GKS'
    // console.log("Start deploy of nft collection...");
    const collectionData = {
        ownerAddress: wallet.contract.address,
        royaltyPercent: 0.05, // 0.05 = 5%
        royaltyAddress: wallet.contract.address,
        nextItemIndex: 0,
        collectionContentUrl: `ipfs://${metadataIpfsHash}/collection.json`,
        commonContentUrl: `ipfs://${metadataIpfsHash}/`,
    };
    const collection = new NftCollection(collectionData);
    // console.log('created instance')
    //
    // let seqno = await collection.deploy(wallet);
    // console.log(`Collection deployed: ${collection.address}`);
    // await waitSeqno(seqno, wallet);

    /** Minting items **/

    const files = await readdir(metadataFolderPath);
    files.pop();
    let index = 0;

    const seqno = await collection.topUpBalance(wallet, files.length);
    await waitSeqno(seqno, wallet);
    console.log(`Balance top-upped`);

    for (const file of files) {
        console.log(`Start deploy of ${index + 1} NFT`);
        const mintParams = {
            queryId: 0,
            itemOwnerAddress: wallet.contract.address,
            itemIndex: index,
            amount: toNano("0.05"),
            commonContentUrl: file,
        };

        const nftItem = new NftItem(collection);
        const seqno = await nftItem.deploy(wallet, mintParams);
        console.log(`Successfully deployed ${index + 1} NFT`);
        await waitSeqno(seqno, wallet);
        index++;
    }
}

void init();

// Start deploy of nft collection...
// created instance
// Collection deployed: EQCicCJ5OQjOCy2O8LfsayxRUg4WjDB8U2x9s1v6k5qt9xQm
// {
//     IpfsHash: 'QmTPSH7bkExWcrdXXwQvhN72zDXK9pZzH3AGbCw13f6Lwx',
//         PinSize: 777156,
//     Timestamp: '2024-07-05T10:56:10.253Z'
// }
// Successfully uploaded the pictures to ipfs: https://gateway.pinata.cloud/ipfs/QmTPSH7bkExWcrdXXwQvhN72zDXK9pZzH3AGbCw13f6Lwx
//     Started uploading metadata files to IPFS...
// { authenticated: true }
// {
//     IpfsHash: 'QmbeNtTJXxZ5Lp5shgP1VYmFJx9eYieS586szLMotE2GKS',
//         PinSize: 1653,
//     Timestamp: '2024-07-05T10:56:12.909Z'
// }
// Successfully uploaded the metadata to ipfs: https://gateway.pinata.cloud/ipfs/QmbeNtTJXxZ5Lp5shgP1VYmFJx9eYieS586szLMotE2GKS
