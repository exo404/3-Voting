const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const deploymentPath = path.join(__dirname, '../deployments/local/SBT.json');
const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

const CONFIG = {
  NUM_WALLETS: 10, // Numero di wallet da creare
  CONTRACT_ADDRESS: "0xe336d36FacA76840407e6836d26119E1EcE0A2b4", 
  SBT_ABI: deployment.abi, 
  FUNDING_AMOUNT: "1.0", 
  OUTPUT_FILE: "wallets_sbt_data.json",

  SBT_DATA_TEMPLATE: {
    names: ["Mario", "Luigi", "Giuseppe", "Francesco", "Antonio", "Marco", "Andrea", "Alessandro", "Matteo", "Luca", "Giovanni", "Roberto", "Stefano", "Davide", "Simone"],
    surnames: ["Rossi", "Bianchi", "Ferrari", "Russo", "Romano", "Gallo", "Costa", "Fontana", "Conti", "Ricci", "Marino", "Greco", "Bruno", "Galli", "Lombardi"],
    birthPlaces: ["Milano", "Roma", "Napoli", "Torino", "Palermo", "Genova", "Bologna", "Firenze", "Bari", "Catania", "Venezia", "Verona", "Messina", "Padova", "Trieste"]
  }
};

function generateSBTData(index) {
  const template = CONFIG.SBT_DATA_TEMPLATE;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  

  const minAge = 18 * 365 * 24 * 60 * 60 ; // 18 anni in millisecondi
  const maxAge = 80 * 365 * 24 * 60 * 60 ; // 80 anni in millisecondi
  let birthDate = currentTimestamp - minAge - Math.floor(Math.random() * (maxAge - minAge));
  if (birthDate < 0) {
    birthDate = -birthDate; 
  }
  
  return {
    issueDate: currentTimestamp,
    name: template.names[index % template.names.length],
    surname: template.surnames[index % template.surnames.length],
    birthDate: birthDate,
    birthPlace: template.birthPlaces[index % template.birthPlaces.length],
    isAdmin: index === 0 
  };
}

async function main() {
  console.log("🚀 Avvio script per creazione wallet e mint SBT...");
  
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deployer address: ${deployer.address}`);
  
  const sbtContract = new ethers.Contract(
    CONFIG.CONTRACT_ADDRESS,
    CONFIG.SBT_ABI,
    deployer
  );
  
  console.log(`📄 Contratto SBT: ${CONFIG.CONTRACT_ADDRESS}`);
  
  const results = {
    networkInfo: {
      name: "3votingchain",
      chainId: 1771,
      timestamp: new Date().toISOString()
    },
    contractAddress: CONFIG.CONTRACT_ADDRESS,
    wallets: []
  };
  
  console.log(`\n👛 Creando ${CONFIG.NUM_WALLETS} wallet...\n`);
  
  for (let i = 0; i < CONFIG.NUM_WALLETS; i++) {
    try {
      console.log(`--- Wallet ${i + 1}/${CONFIG.NUM_WALLETS} ---`);
      
      const wallet = ethers.Wallet.createRandom();
      const connectedWallet = wallet.connect(ethers.provider);
      
      console.log(`💳 Address: ${wallet.address}`);
      console.log(`🔐 Private Key: ${wallet.privateKey}`);
      
      const fundingTx = await deployer.sendTransaction({
        to: wallet.address,
        value: ethers.parseEther(CONFIG.FUNDING_AMOUNT)
      });
      
      console.log(`💰 Funding TX: ${fundingTx.hash}`);
      await fundingTx.wait();
      
      const balance = await ethers.provider.getBalance(wallet.address);
      console.log(`💵 Balance: ${ethers.formatEther(balance)} AVAX`);
      
      const sbtData = generateSBTData(i);
      
      console.log(`📋 Dati SBT generati:`);
      console.log(`   Nome: ${sbtData.name} ${sbtData.surname}`);
      console.log(`   Data nascita: ${new Date(sbtData.birthDate * 1000).toLocaleDateString()}`);
      console.log(`   Luogo nascita: ${sbtData.birthPlace}`);
      console.log(`   Admin: ${sbtData.isAdmin}`);
      console.log(`   Data emissione: ${new Date(sbtData.issueDate * 1000).toLocaleString()}`);
      
      console.log(`🎨 Creando SBT...`);
      
      const sbtContractWithWallet = sbtContract.connect(connectedWallet);
      
      const createSBTTx = await sbtContractWithWallet.createSBT(sbtData);
      console.log(`🎯 CreateSBT TX: ${createSBTTx.hash}`);
      
      const createSBTReceipt = await createSBTTx.wait();
      console.log(`✅ CreateSBT confermato nel blocco: ${createSBTReceipt.blockNumber}`);
      
      const sbtBalance = await sbtContract.balanceOf(wallet.address);
      console.log(`🏷️  SBT Balance: ${sbtBalance.toString()}`);
      
      let tokenId = null;
      if (sbtBalance > 0) {
        try {
          tokenId = await sbtContract.tokenOfOwnerByIndex(wallet.address, 0);
          console.log(`🆔 Token ID: ${tokenId.toString()}`);
        } catch (error) {
          console.log(`ℹ️  Token ID non disponibile: ${error.message}`);
        }
      }
      
      const walletData = {
        index: i + 1,
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase,
        balance: ethers.formatEther(balance),
        sbtData: {
          issueDate: sbtData.issueDate,
          name: sbtData.name,
          surname: sbtData.surname,
          birthDate: sbtData.birthDate,
          birthPlace: sbtData.birthPlace,
          isAdmin: sbtData.isAdmin,
          issueDateReadable: new Date(sbtData.issueDate * 1000).toLocaleString(),
          birthDateReadable: new Date(sbtData.birthDate * 1000).toLocaleDateString()
        },
        sbt: {
          createTransactionHash: createSBTTx.hash,
          blockNumber: createSBTReceipt.blockNumber,
          gasUsed: createSBTReceipt.gasUsed.toString(),
          balance: sbtBalance.toString(),
          tokenId: tokenId ? tokenId.toString() : null
        },
        timestamp: new Date().toISOString()
      };
      
      results.wallets.push(walletData);
      
      console.log(`✅ Wallet ${i + 1} completato\n`);
      
      if (i < CONFIG.NUM_WALLETS - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ Errore con wallet ${i + 1}:`, error.message);
      
      results.wallets.push({
        index: i + 1,
        address: wallet?.address || null,
        privateKey: wallet?.privateKey || null,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  const outputPath = path.join(__dirname, CONFIG.OUTPUT_FILE);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`\n📊 RIEPILOGO:`);
  console.log(`✅ Wallet creati: ${results.wallets.length}`);
  console.log(`✅ SBT creati: ${results.wallets.filter(w => w.sbt && w.sbt.balance > 0).length}`);
  console.log(`👑 Admin wallet: ${results.wallets.filter(w => w.sbtData && w.sbtData.isAdmin).length}`);
  console.log(`📁 File salvato: ${outputPath}`);
  
  console.log(`\n🎉 Script completato!`);
}

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