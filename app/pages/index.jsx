import React from 'react'
import getConfig from 'next/config'
import Head from 'next/head'
import Web3 from 'web3'
import { Modal } from '../components/Modal'

class Index extends React.Component {
  constructor(props) {
    super(props);

    const web3 = new Web3(getConfig().publicRuntimeConfig.rpcURL);

    this.state = { totalStakeAmount: 5000, web3, lockButtons: false };

    this.onChangeStakeAmount = this.onChangeStakeAmount.bind(this);
    this.onFinishStakingEpoch = this.onFinishStakingEpoch.bind(this);
    this.onRebalance = this.onRebalance.bind(this);
    this.onRefresh = this.onRefresh.bind(this);
  }

  async componentDidMount() {
    await this.initContract(this.state.web3);
    if (window.ethereum) {
      window.ethereum.autoRefreshOnNetworkChange = false;
    }
    await this.loadData();
  }

  async initContract(web3) {
    const { publicRuntimeConfig } = getConfig();
    const rewardContract = new web3.eth.Contract(
      publicRuntimeConfig.rewardContractABI,
      publicRuntimeConfig.rewardContractAddress
    );
    await this.setState({ rewardContract });
  }

  async loadData() {
    const { rewardContract, web3 } = this.state;
    let currentData = await rewardContract.methods.getCurrentDataBatch().call();
    if (currentData) {
      currentData._ethUsd /= 100;
      currentData._ethUsdCurrent /= 100;
      currentData._exitCurrentSupply = web3.utils.fromWei(currentData._exitCurrentSupply, 'ether');
      currentData._exitCurrentSupply = Math.trunc(currentData._exitCurrentSupply * 1000) / 1000;
      currentData._softETHCurrentSupply = web3.utils.fromWei(currentData._softETHCurrentSupply, 'ether');
      currentData._softETHCurrentSupply = Math.trunc(currentData._softETHCurrentSupply * 1000) / 1000;
      currentData._softETHExpectedSupply = web3.utils.fromWei(currentData._softETHExpectedSupply, 'ether');
      currentData._softETHExpectedSupply = Math.trunc(currentData._softETHExpectedSupply * 1000) / 1000;
      currentData._stakeUsd /= 100;
    }
    await this.setState({ currentData });
  }

  /*
  static getInitialProps(ctx) {
    if (ctx.req) {
      const fs = require('fs');
      const data = fs.readFileSync('someTestData.txt', 'utf-8');
      console.log('server side');
      return { name: data };
    }
    console.log('client side');
    return {};
  }
  */

  onChangeStakeAmount(e) {
    this.setState({ totalStakeAmount: e.target.value });
  }

  sendTx(method, account) {
    const { web3 } = this.state;
    const _this = this;

    this.setState({ lockButtons: true });
    method.send({
      gasPrice: web3.utils.toWei('5', 'gwei'),
      from: account
    }, async function(error, txHash) {
      if (error) {
        _this.showAlert('Error', error.message);
      } else {
        try {
          let tx
          let currentBlockNumber
          const maxWaitBlocks = 6
          const startBlockNumber = (await web3.eth.getBlockNumber()) - 0
          const finishBlockNumber = startBlockNumber + maxWaitBlocks
          do {
            await _this.sleep(3) // seconds
            tx = await web3.eth.getTransactionReceipt(txHash)
            currentBlockNumber = await web3.eth.getBlockNumber()
          } while (tx === null && currentBlockNumber <= finishBlockNumber)
          if (tx) {
            if (tx.status === true || tx.status === '0x1') {
              _this.showAlert('Success', 'Transaction has been mined successfully.', () => {window.location.reload(true)});
            } else {
              _this.showAlert('Transaction reverted', 'Transaction reverted');
            }
          } else {
            _this.showAlert('Timeout', `Your transaction was not mined in ${maxWaitBlocks} blocks. Please, try again with the increased gas price or fixed nonce (use Reset Account feature of MetaMask).`);
          }
        } catch (e) {
          _this.showAlert('Exception', e.message);
        }
      }
      _this.setState({ lockButtons: false });
    });
  }

  async onFinishStakingEpoch() {
    const account = await this.unlockMetaMaskAccount();
    if (account) {
      let { rewardContract, totalStakeAmount, web3 } = this.state;
      totalStakeAmount = $.trim(totalStakeAmount.toString());

      if (!/^[0-9]+$/.test(totalStakeAmount) || totalStakeAmount == 0) {
        this.showAlert('Invalid amount', 'Please enter correct non-zero amount.');
      } else {
        const totalStakeAmountWei = web3.utils.toWei(totalStakeAmount, 'ether');
        this.sendTx(
          rewardContract.methods.finishStakingEpoch(totalStakeAmountWei),
          account
        );
      }
    }
  }

  async onRebalance() {
    const account = await this.unlockMetaMaskAccount();
    if (account) {
      this.sendTx(
        this.state.rewardContract.methods.rebalance(),
        account
      );
    }
  }

  async onRefresh() {
    await this.setState({ currentData: null });
    await this.loadData();
  }

  async sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000))
  }

  showAlert(title, message, callback) {
    this.refs.modal.show(title, message, callback);
  }

  softETHtoEXITRatio() {
    const { currentData } = this.state;
    const ratio = currentData._softETHCurrentSupply * currentData._ethUsdCurrent / currentData._exitCurrentSupply;
    return Math.round(ratio * 100) / 100;
  }

  async unlockMetaMaskAccount() {
    const { web3 } = this.state;
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      this.showAlert('MetaMask not found', 'Please install MetaMask and reload the page.');
      return null;
    }
    const mmWeb3 = new Web3(window.ethereum);
    const mmChainId = await mmWeb3.eth.getChainId();
    const chainId = await web3.eth.getChainId();
    if (chainId != mmChainId) {
      this.showAlert('Selected chain is incorrect', `Please switch MetaMask to ${this.chainByID(chainId)} chain.`);
      return null;
    }
    try {
      await window.ethereum.enable()
    } catch (e) {
      this.showAlert('You denied account authorization', 'Please connect to MetaMask to share your address with the Application.');
      return null;
    }
    const accounts = await mmWeb3.eth.getAccounts();
    const account = accounts[0] || null;
    if (!account) {
      this.showAlert('Unlock your wallet', 'Application doesn\'t see your address in MetaMask.');
    }
    await this.initContract(mmWeb3);
    await this.setState({ web3: mmWeb3 });
    return account;
  }

  chainByID(id) {
    switch(id) {
    case 1:
      return 'Ethereum Mainnet';
    case 42:
      return 'Kovan';
    default:
      return `ID ${id}`;
    }
  }

  render() {
    const { currentData, lockButtons, totalStakeAmount } = this.state;

    const loading = <span className="spinner-border text-info" role="status">
      <span className="sr-only">Loading...</span>
    </span>;
    const loadingSmall = <span className="spinner-border spinner-border-sm text-info" role="status">
      <span className="sr-only">Loading...</span>
    </span>;
    const loadingButton = label => (<span>
      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      &nbsp;{label} ...
    </span>);

    return (
      <div>
        <Head>
          <title>DApp for the EXIT Reward Token prototype</title>
          <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no" />
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossOrigin="anonymous" />
        </Head>

        <div className="container">
          <div className="row justify-content-md-center">
            <div className="col-md-auto" align="center">
              <table className="table table-borderless mb-0" style={{width:'320px'}}>
                <tbody>
                  <tr>
                    <td>Current staking epoch</td>
                    <td width="30%">{currentData ? currentData._lastStakingEpochFinished : loadingSmall}</td>
                  </tr>
                  <tr>
                    <td>STAKE/USD</td>
                    <td>{currentData ? currentData._stakeUsd : loadingSmall}</td>
                  </tr>
                  <tr>
                    <td>ETH/USD (last rebalance)</td>
                    <td>{currentData ? currentData._ethUsd : loadingSmall}</td>
                  </tr>
                  <tr>
                    <td>ETH/USD (current)</td>
                    <td>{currentData ? currentData._ethUsdCurrent : loadingSmall}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-auto" align="center">
              <table className="table table-borderless mb-0" style={{width:'320px'}}>
                <tbody>
                  <tr>
                    <td>EXIT total supply</td>
                    <td width="30%">{currentData ? currentData._exitCurrentSupply : loadingSmall}</td>
                  </tr>
                  <tr>
                    <td>SoftETH total supply</td>
                    <td>{currentData ? currentData._softETHCurrentSupply : loadingSmall}</td>
                  </tr>
                  <tr>
                    <td>SoftETH expected supply</td>
                    <td>{currentData ? currentData._softETHExpectedSupply : loadingSmall}</td>
                  </tr>
                  <tr>
                    <td colSpan="2">
                      <button type="button" className="btn btn-outline-secondary btn-sm btn-block" onClick={this.onRefresh} disabled={!currentData}>
                        {currentData ? 'Refresh' : loadingButton('Loading')}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="row justify-content-md-center">
            <div className="col-md-auto" align="center">
              <table className="table table-borderless mb-0" style={{width:'320px',height:'150px'}}>
                <tbody>
                  <tr>
                    <td align="center" className="align-bottom">
                      SoftETH : EXIT
                      <h1>{currentData ? this.softETHtoEXITRatio() + ' : 1' : loading}</h1>
                      <button type="button" className="btn btn-info btn-block" onClick={this.onRebalance} disabled={lockButtons}>
                        {!lockButtons ? 'Rebalance' : loadingButton('Waiting')}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-auto" align="center">
              <table className="table table-borderless mb-0" style={{width:'320px',height:'150px'}}>
                <tbody>
                  <tr>
                    <td align="center" className="align-bottom">
                      <div className="input-group">
                        <input type="text" className="form-control text-right" placeholder="STAKE tokens amount" defaultValue={totalStakeAmount} onChange={this.onChangeStakeAmount} disabled={lockButtons} />
                        <div className="input-group-append">
                          <span className="input-group-text">.00 STAKE</span>
                        </div>
                      </div>
                      <button type="button" className="btn btn-info btn-block mt-3" onClick={this.onFinishStakingEpoch} disabled={lockButtons}>
                        {!lockButtons ? 'Finish Staking Epoch' : loadingButton('Waiting')}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Modal ref="modal" />

        <script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossOrigin="anonymous" />
        <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossOrigin="anonymous" />
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossOrigin="anonymous" />
      </div>
    );
  }
}

export default Index;