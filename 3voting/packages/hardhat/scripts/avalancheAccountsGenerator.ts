const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const CONFIG = {
    NUM_WALLETS: 10, // Numero di wallet da creare
    CONTRACT_ADDRESS: "0xe336d36FacA76840407e6836d26119E1EcE0A2b4",
    SBT_CONTRACT_ABI: [
        // Inserisci qui l'ABI del tuo contratto SBT
        // Esempio di funzione mint:
        "function mint(address to) external returns (uint256)",
        "function balanceOf(address owner) external view returns (uint256)",
        "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)"
    ],
    FUNDING_AMOUNT: "1.0", // AVAX da inviare a ogni wallet per le gas fees
    OUTPUT_FILE: "wallets_sbt_data.json"
};

async function main() {
    console.log("🚀 Avvio script per creazione wallet e mint SBT...");

    // Ottieni il signer principale (deployer/funder)
    const [deployer] = await ethers.getSigners();
    console.log(`📝 Deployer address: ${deployer.address}`);

    // Connetti al contratto SBT
    const sbtContract = new ethers.Contract(
        CONFIG.CONTRACT_ADDRESS,
        CONFIG.SBT_CONTRACT_ABI,
        deployer
    );

    console.log(`📄 Contratto SBT: ${CONFIG.CONTRACT_ADDRESS}`);

    const results = {
        networkInfo: {
            name: "Avalanche L1 Local",
            chainId: await ethers.provider.getNetwork().then(n => n.chainId),
            timestamp: new Date().toISOString()
        },
        contractAddress: CONFIG.CONTRACT_ADDRESS,
        wallets: []
    };

    console.log(`\n👛 Creando ${CONFIG.NUM_WALLETS} wallet...\n`);

    for (let i = 0; i < CONFIG.NUM_WALLETS; i++) {
        try {
            console.log(`--- Wallet ${i + 1}/${CONFIG.NUM_WALLETS} ---`);

            // Crea un nuovo wallet
            const wallet = ethers.Wallet.createRandom();
            const connectedWallet = wallet.connect(ethers.provider);

            console.log(`💳 Address: ${wallet.address}`);
            console.log(`🔐 Private Key: ${wallet.privateKey}`);

            // Finanzia il wallet
            const fundingTx = await deployer.sendTransaction({
                to: wallet.address,
                value: ethers.parseEther(CONFIG.FUNDING_AMOUNT)
            });

            console.log(`💰 Funding TX: ${fundingTx.hash}`);
            await fundingTx.wait();

            const balance = await ethers.provider.getBalance(wallet.address);
            console.log(`💵 Balance: ${ethers.formatEther(balance)} AVAX`);

            // Mint SBT
            console.log(`🎨 Minting SBT...`);

            // Connetti il contratto con il nuovo wallet
            const sbtContractWithWallet = sbtContract.connect(connectedWallet);

            // Esegui la funzione mint (adatta in base alla tua implementazione)
            const mintTx = await sbtContractWithWallet.mint(wallet.address);
            console.log(`🎯 Mint TX: ${mintTx.hash}`);

            const mintReceipt = await mintTx.wait();
            console.log(`✅ Mint confermato nel blocco: ${mintReceipt.blockNumber}`);

            // Verifica il balance SBT
            const sbtBalance = await sbtContract.balanceOf(wallet.address);
            console.log(`🏷️  SBT Balance: ${sbtBalance.toString()}`);

            // Ottieni il token ID se disponibile
            let tokenId = null;
            if (sbtBalance > 0) {
                try {
                    tokenId = await sbtContract.tokenOfOwnerByIndex(wallet.address, 0);
                    console.log(`🆔 Token ID: ${tokenId.toString()}`);
                } catch (error) {
                    console.log(`ℹ️  Token ID non disponibile: ${error.message}`);
                }
            }

            // Salva i dati del wallet
            const walletData = {
                index: i + 1,
                address: wallet.address,
                privateKey: wallet.privateKey,
                mnemonic: wallet.mnemonic.phrase,
                balance: ethers.formatEther(balance),
                sbt: {
                    mintTransactionHash: mintTx.hash,
                    blockNumber: mintReceipt.blockNumber,
                    gasUsed: mintReceipt.gasUsed.toString(),
                    balance: sbtBalance.toString(),
                    tokenId: tokenId ? tokenId.toString() : null
                },
                timestamp: new Date().toISOString()
            };

            results.wallets.push(walletData);

            console.log(`✅ Wallet ${i + 1} completato\n`);

            // Pausa per evitare spam
            if (i < CONFIG.NUM_WALLETS - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.error(`❌ Errore con wallet ${i + 1}:`, error.message);

            // Aggiungi comunque i dati parziali
            results.wallets.push({
                index: i + 1,
                address: wallet?.address || null,
                privateKey: wallet?.privateKey || null,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Salva i risultati in JSON
    const outputPath = path.join(__dirname, CONFIG.OUTPUT_FILE);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log(`\n📊 RIEPILOGO:`);
    console.log(`✅ Wallet creati: ${results.wallets.length}`);
    console.log(`✅ SBT mintati: ${results.wallets.filter(w => w.sbt && w.sbt.balance > 0).length}`);
    console.log(`📁 File salvato: ${outputPath}`);

    console.log(`\n🎉 Script completato!`);
}

// Funzione di utilità per verificare lo stato dei wallet
async function verifyWallets() {
    console.log("🔍 Verifica stato wallet...");

    const outputPath = path.join(__dirname, CONFIG.OUTPUT_FILE);

    if (!fs.existsSync(outputPath)) {
        console.log("❌ File dei wallet non trovato. Esegui prima il main script.");
        return;
    }

    const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    const sbtContract = new ethers.Contract(
        CONFIG.CONTRACT_ADDRESS,
        CONFIG.SBT_CONTRACT_ABI,
        ethers.provider
    );

    console.log(`📊 Verifica di ${data.wallets.length} wallet...\n`);

    for (const walletData of data.wallets) {
        if (!walletData.address) continue;

        const balance = await ethers.provider.getBalance(walletData.address);
        const sbtBalance = await sbtContract.balanceOf(walletData.address);

        console.log(`${walletData.address}:`);
        console.log(`  AVAX: ${ethers.formatEther(balance)}`);
        console.log(`  SBT: ${sbtBalance.toString()}`);
        console.log();
    }
}

// Esegui lo script
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Errore:", error);
            process.exit(1);
        });
}

module.exports = {
    main,
    verifyWallets,
    CONFIG
};