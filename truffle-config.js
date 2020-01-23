module.exports = {
  networks: {
    coverage: {
      host: "127.0.0.1",
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
      network_id: "*"
    },
    development: {
      host: "127.0.0.1",
      port: 8544,
      network_id: "*",
      gasPrice: 5000000000
    },
    mainnet: {
      // to be defined
    }
  },
  compilers: {
    solc: {
      version: "0.5.16",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "istanbul"
      }
    }
  }
}
