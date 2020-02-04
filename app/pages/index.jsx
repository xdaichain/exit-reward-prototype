import React from 'react'
import getConfig from 'next/config'
import Head from 'next/head'
import Web3 from 'web3'

class Index extends React.Component {
  constructor(props) {
    super(props);

    const { publicRuntimeConfig } = getConfig();
    const web3 = new Web3(publicRuntimeConfig.rpcURL);
    const rewardContract = new web3.eth.Contract(
      publicRuntimeConfig.rewardContractABI,
      publicRuntimeConfig.rewardContractAddress
    );

    this.state = { rewardContract, totalStakeAmount: 5000, web3 };

    this.onChangeStakeAmount = this.onChangeStakeAmount.bind(this);
    this.onFinishStakingEpoch = this.onFinishStakingEpoch.bind(this);
    this.onRefresh = this.onRefresh.bind(this);
  }

  async loadData() {
    const { rewardContract } = this.state;
    const currentData = await rewardContract.methods.getCurrentDataBatch().call();
    this.setState({ currentData });
  }

  async componentDidMount() {
    await this.loadData();
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

  onFinishStakingEpoch() {
    const { rewardContract, totalStakeAmount, web3 } = this.state;
    const totalStakeAmountWei = web3.utils.toWei(totalStakeAmount.toString(), 'ether');
    alert('Not implemented yet');
    // rewardContract.methods.finishStakingEpoch(totalStakeAmount).send({from: });
  }

  onRebalance() {
    alert('Not implemented yet');
  }

  async onRefresh() {
    this.setState({ currentData: null });
    await this.loadData();
  }

  /*
  softETHtoEXITRatio() {
    const { currentData } = this.state;
    // softETHCurrentSupply * ethUsdCurrent / exitCurrentSupply
  }
  */

  render() {
    const { currentData, totalStakeAmount } = this.state;

    const loading = <span className="spinner-border spinner-border-sm text-info" role="status">
      <span className="sr-only">Loading...</span>
    </span>;
    const loadingButton = <span>
      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      &nbsp;Loading ...
    </span>;

    return (
      <div>
        <Head>
          <title>DApp for the EXIT Reward Token prototype</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossOrigin="anonymous" />
        </Head>

        <div className="container-fluid mt-3">
          <div className="row justify-content-md-center">
            <div className="col-3">
              <div className="container">
                <div className="row justify-content-md-center">
                  <div className="col-8 text-nowrap">
                    <p>Current staking epoch</p>
                    <p>STAKE/USD rate</p>
                    <p>EXIT total supply</p>
                    <p>ETH/USD rate</p>
                    <p>SoftETH total supply</p>
                    <p>SoftETH expected supply</p>
                    <p>SoftETH:EXIT</p>
                  </div>
                  <div className="col-4 pl-0">
                    <p>{currentData ? currentData._lastStakingEpochFinished : loading}</p>
                    <p>{currentData ? currentData._stakeUsd / 100 : loading}</p>
                    <p>{currentData ? currentData._exitCurrentSupply : loading}</p>
                    <p>{currentData ? currentData._ethUsdCurrent / 100 : loading}</p>
                    <p>{currentData ? currentData._softETHCurrentSupply : loading}</p>
                    <p>{currentData ? currentData._softETHExpectedSupply : loading}</p>
                    <p>???</p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12">
                    <button type="button" className="btn btn-outline-secondary btn-sm btn-block mb-3" onClick={this.onRefresh} disabled={!currentData}>{currentData ? 'Refresh' : loadingButton}</button>

                    <div className="input-group">
                      <input type="text" className="form-control text-right" placeholder="STAKE tokens amount" defaultValue={totalStakeAmount} onChange={this.onChangeStakeAmount} />
                      <div className="input-group-append">
                        <span className="input-group-text">.00 STAKE</span>
                      </div>
                    </div>
                    <button type="button" className="btn btn-info btn-block mb-3" onClick={this.onFinishStakingEpoch}>Finish Staking Epoch</button>

                    <button type="button" className="btn btn-info btn-block mb-3" onClick={this.onRebalance}>Rebalance</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/*
          <script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossOrigin="anonymous" />
          <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossOrigin="anonymous" />
          <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossOrigin="anonymous" />
        */}
      </div>
    );
  }
}

export default Index;