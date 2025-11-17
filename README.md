# Cross-Border Payments With Zksync Era Layer-2 
is the practical part of my Masters thesis "using blockchain technology in cross-border payments and remittances".

# Instructions

* Install Foundry: https://book.getfoundry.sh/getting-started/installation 
* foundry_project inside cross_border_payment should be used to deploy the smart contract (use deploy_contracts.sh with your intended rpc_urls and deploy commands). It can also be used to run local blockchains in the local machine. Follow the instructions in cbpr_dapp/foundry_project.
* python3 and flask should be installed to run the web client.
* The smart contracts can be initialized from the web client with the information in sc_init.json.
* Zksync layer is inside the project file with the payloads that are used to stress test layer-1 and layer-2 
* ISO20022 standard pacs.008 messages maybe used for testing the transaction process
