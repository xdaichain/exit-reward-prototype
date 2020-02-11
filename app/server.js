const config = require(`${__dirname}/next.config.js`);
const { getCurrentPoint, sleep, today, yesterday } = require(`${__dirname}/components/utils.js`);
const fs = require('fs');
const Web3 = require('web3');

const dataDir = `${__dirname}/data`;
const ratioReadInterval = config.ratioReadInterval;
const rebalanceInterval = config.rebalanceInterval;
const web3 = new Web3(config.publicRuntimeConfig.rpcURL);
const rewardContract = new web3.eth.Contract(
  config.publicRuntimeConfig.rewardContractABI,
  config.publicRuntimeConfig.rewardContractAddress
);

log('Start', true);

if (!getPrivateKey()) {
  log('Warning: private key is not specified. Autorebalance will not work')
}

var lastRebalancePoint = getLastRebalancePoint();

// When we must read the ratio next time (timeout in seconds from the current moment).
const ratioReadTimeElapsed = getCurrentPoint() - getLastRatioReadPoint();
const ratioReadInitialTimeout = Math.max(ratioReadInterval - ratioReadTimeElapsed, 0);
setTimeout(readOrRebalance, ratioReadInitialTimeout * 1000);

if (ratioReadInitialTimeout > 0) {
  log(`The next iteration will start in ${ratioReadInitialTimeout} second(s)`);
}

// Reads SoftETH:EXIT ratio from the contract and saves the given value to CSV.
// Rebalances the SoftETH supply every `rebalanceInterval` seconds.
async function readOrRebalance() {
  let rebalanced = false;

  if (getCurrentPoint() - lastRebalancePoint >= rebalanceInterval) {
    log('Rebalancing');

    try {
      const bytecode = await rewardContract.methods.rebalance().encodeABI();
      const gas = await rewardContract.methods.rebalance().estimateGas();
      const tx = await web3.eth.accounts.signTransaction({
        to: config.publicRuntimeConfig.rewardContractAddress,
        data: bytecode,
        gas: Math.trunc(gas * 1.2)
      }, getPrivateKey());

      log(`  Waiting for tx ${tx.transactionHash} to be mined...`);
      web3.eth.transactionBlockTimeout = 1;
      web3.eth.transactionConfirmationBlocks = 1;
      const receipt = await web3.eth.sendSignedTransaction(tx.rawTransaction);
      if (receipt.status === true || receipt.status === '0x1') {
        rebalanced = true;
        log(`  Rebalanced successfully at block #${receipt.blockNumber}. Gas used: ${receipt.gasUsed}`);
      } else {
        log('  Transaction was reverted');
      }
    } catch(e) {
      log(` Exception thrown: ${e.message}`);
    }

    if (rebalanced) {
      let multiplier = 2;
      lastRebalancePoint = getCurrentPoint();
      try {
        multiplier = await rewardContract.methods.COLLATERAL_MULTIPLIER().call();
      } catch(e) {
        log(`Cannot read COLLATERAL_MULTIPLIER from the contract. Using ${multiplier} as a default`);
      }
      saveRatioToCSV(multiplier, true);
    }
  }

  if (!rebalanced) {
    // Read and save the current SoftETH:EXIT ratio to CSV
    const ratio = await getSoftETHtoEXITRatio();
    if (ratio !== null) {
      saveRatioToCSV(ratio);
    }
  }

  setTimeout(readOrRebalance, ratioReadInterval * 1000);
}

// Returns unix timestamp (in UTC) for the latest known point of the ratio reading.
function getLastRatioReadPoint(day = today()) {
  let lastPoint = 0;
  try {
    const content = fs.readFileSync(`${dataDir}/${day}.csv`, { encoding: 'utf8' });
    const lines = content.trim().split(/\r?\n/);
    const firstLine = lines[0].split(';');
    if (firstLine.length != 3) throw Error;
    const time = firstLine[0];
    const ratio = firstLine[1];
    const rebalanced = firstLine[2];
    lastPoint = Date.parse(`${day} ${time} UTC`) / 1000;
  } catch(e) {
    const _yesterday = yesterday();
    if (day != _yesterday) {
      lastPoint = getLastRatioReadPoint(_yesterday);
    }
  }
  return lastPoint; // seconds since 1970-01-01 00:00:00 UTC
}

// Returns unix timestamp (in UTC) for the latest known point of the rebalancing.
function getLastRebalancePoint(day = today()) {
  let lastPoint = 0;
  try {
    const content = fs.readFileSync(`${dataDir}/${day}.csv`, { encoding: 'utf8' });
    const lines = content.trim().split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].split(';');
      if (line.length != 3) continue;
      const time = line[0];
      const ratio = line[1];
      const rebalanced = line[2];
      if (rebalanced == 1) {
        lastPoint = Date.parse(`${day} ${time} UTC`) / 1000;
        break;
      }
    }

    if (!lastPoint) throw Error;
  } catch(e) {
    const _yesterday = yesterday();
    if (day != _yesterday) {
      lastPoint = getLastRebalancePoint(_yesterday);
    }
  }
  return lastPoint; // seconds since 1970-01-01 00:00:00 UTC
}

function getPrivateKey() {
  if (!config.privateKey) return null;
  const key = config.privateKey.trim();
  if (!key) return null;
  if (!key.startsWith('0x') && !key.startsWith('0X')) return `0x${key}`;
  return key;
}

async function getSoftETHtoEXITRatio(_try = 1) {
  log(`Reading the ratio from the contract${_try > 1 ? ' try #' + _try : ''}`);
  let ratio = null;
  try {
    let data = await rewardContract.methods.getCurrentDataBatch().call();

    data._ethUsdCurrent /= 100;
    data._exitCurrentSupply = web3.utils.fromWei(data._exitCurrentSupply, 'ether');
    data._exitCurrentSupply = Math.trunc(data._exitCurrentSupply * 1000) / 1000;
    data._softETHCurrentSupply = web3.utils.fromWei(data._softETHCurrentSupply, 'ether');
    data._softETHCurrentSupply = Math.trunc(data._softETHCurrentSupply * 1000) / 1000;

    ratio = data._softETHCurrentSupply * data._ethUsdCurrent / data._exitCurrentSupply;
    ratio = Math.round(ratio * 100) / 100;

    log('  Read successfully');
  } catch(e) {
    if (_try < 3) { // try three times
      await sleep(10); // wait for a few seconds
      ratio = await getSoftETHtoEXITRatio(++_try);
    }
  }
  return ratio;
}

// Prints log message with the current time.
function log(message, emptyPreLine) {
  const now = new Date;
  const year = now.getUTCFullYear();
  const month = (now.getUTCMonth() - 0 + 1).toString().padStart(2, '0');
  const day = now.getUTCDate().toString().padStart(2, '0');
  const hours = (now.getUTCHours() - 0).toString().padStart(2, '0');
  const minutes = (now.getUTCMinutes() - 0).toString().padStart(2, '0');
  const seconds = (now.getUTCSeconds() - 0).toString().padStart(2, '0');
  const time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
  if (emptyPreLine) {
    console.log('');
  }
  console.log(`${time} ${message}`);
}

function saveRatioToCSV(ratio, rebalanced) {
  log(`Saving ratio ${ratio} to CSV${rebalanced ? ' after rebalancing' : ''}`);

  rebalanced = rebalanced ? '1' : '';

  const now = new Date;
  const hours = (now.getUTCHours() - 0).toString().padStart(2, '0');
  const minutes = (now.getUTCMinutes() - 0).toString().padStart(2, '0');
  const line = `${hours}:${minutes};${ratio};${rebalanced}`;

  const filepath = `${dataDir}/${today()}.csv`;
  let content = '';
  try {
    content = fs.readFileSync(filepath, { encoding: 'utf8' });
  } catch(e) {}
  try {
    fs.mkdirSync(dataDir);
  } catch(e) {}
  const newContent = content.length > 0 ? `${line}\n${content}` : line;
  fs.writeFileSync(filepath, newContent, { encoding: 'utf8' });

  log(`  Saved successfully to ${filepath}`)
}
