# A prototype of EXIT stable token

See https://poa.gitbook.io/exit/ first to get the detailed info of the concept.

## Contracts

This prototype consists of three contracts:
- **Reward** is a main contract which emulates a rewardable action (in this case - finishing staking epoch and minting EXIT tokens) and implements the rebalance mechanism of SoftETH tokens total supply. This contract is upgradeable by the `RewardProxy` contract.

- **ExitToken** is an ERC20 token contract representing EXIT token. It is mintable by the `Reward` contract. Initially, it's created with an empty supply. The supply is increased by the `Reward.finishStakingEpoch()` function (see below). No one else can mint the EXIT tokens.

- **SoftETHToken** is an ERC20 token contract representing SoftETH token. It is mintable and burnable by the `Reward` contract. Initially, it's created with an empty supply. The supply is changed by the `Reward.rebalance()` function (see below). No one else can mint or burn the SoftETH tokens.

These contracts are to be deployed in Ethereum Mainnet only. We use a public [price oracle contract](https://etherscan.io/address/0xad13fe330b0ae312bc51d2e5b9ca2ae3973957c7#code) available on Mainnet to retrieve the current ETH/USD rate.

#### Reward contract constants

These constants are supposed to be unchanged during prototype's life:

- **COLLATERAL_MULTIPLIER** defines how many times the USD worth of SoftETH tokens must exceed the total supply of EXIT tokens. It's equal to 2.

- **EXIT_MINT_RATE** defines the percent rate of how many EXIT tokens must be minted in relation to the USD worth of STAKE tokens totally staked. It's defined as 10%.

#### Reward contract setters

The Reward contract contains three setters:
1. **finishStakingEpoch** accepts `totalStakeAmount` as a single parameter and emulates finishing of staking epoch. The `totalStakeAmount` defines the total amount of STAKE tokens staked by the moment of staking epoch end. This parameter is used along with `STAKE/USD` rate and `EXIT_MINT_RATE` to calculate the amount of EXIT tokens needed to be minted as a reward. The function mints EXIT tokens and calls the `rebalance` function. `finishStakingEpoch` can be called by anyone at any time.

2. **rebalance** rebalances the `totalSupply` of SoftETH tokens so that it would exceed EXIT token supply `COLLATERAL_MULTIPLIER` times in USD worth. This function doesn't accept any parameters and can be called by anyone at any time.

3. **setSTAKEUSD** sets the current STAKE/USD rate in USD cents (for example, `10 USD` would be `1000`). Can only be called by an address named `Currency Rate Changer` (see below).

#### Reward contract getters

There are a few public getters which could be helpful:

- **ethUsdCurrent** returns the current amount of USDTs in 1 ETH (in USD cents) provided by the price oracle. The returned value has 2 decimals.

- **usdEthCurrent** returns the current amount of ETHs in 1 USDT (i.e. USDT/ETH rate) provided by the price oracle. The returned amount has 18 decimals.

- **softETHCurrentSupply** returns the current total supply of SoftETH tokens.

- **softETHExpectedSupply** returns the current expected supply of SoftETH tokens based on the current supply of EXIT tokens, `COLLATERAL_MULTIPLIER`, and the current USDT/ETH rate.

- **ethUsd** returns the latest known ETH/USD rate (in USD cents) set by `rebalance` function. The returned amount has 2 decimals.

- **stakeUsd** returns the STAKE/USD rate set by `setSTAKEUSD` function. The returned amount has 2 decimals.

The `Reward` contract is well documented, so you can look into its code and get the detailed information about each function.

The ABIs will be provided after we deploy the contracts on Mainnet.

## User roles

The Reward contract assumes to have three users:

1. `Proxy admin` who can upgrade the code of the `Reward` contract through the `RewardProxy` contract. The proxy admin cannot call `Reward` functions.

2. `Staker` is an arbitrary address which receives minted EXIT tokens. The `Staker` emulates the staking of STAKE tokens (as a single staker in the system). When the `Reward.finishStakingEpoch` function is called (by any address) with a non-zero `totalStakeAmount` parameter, it's supposed that the staker had staked `totalStakeAmount` STAKE tokens before staking epoch finished. This prototype doesn't have STAKE token contract - the tokens are only emulated by the `Reward.finishStakingEpoch` function.

3. `Currency Rate Changer` is an address that is allowed to call the `Reward.setSTAKEUSD` function. For simplicity, we assume this address is the same as `Staker`.

## Contracts deployment on Ethereum Mainnet

1. Clone the repo and initialize it:

    ```bash
    $ git clone https://github.com/xdaichain/exit-reward-prototype
    $ cd exit-reward-prototype
    $ npm i
    ```

2. Create `keys` file in the root of the repo which should contain private keys for the `admin` and `staker`/`currencyRateChanger` addresses (one line for each).

    Example of the `keys` file content (the first is for the `admin`, the second is for `staker`/`currencyRateChanger`):

    ```
    123a...bc45
    678d...ef90
    ```
    
    The `admin` address cannot be the same as `staker`/`currencyRateChanger`.
    
    Make sure the `admin` address has at least 0.02 ETH and the `staker`/`currencyRateChanger` has at least 0.001 ETH.

3. Set appropriate `gasPrice` in `truffle-config.js` (the default is 5 gwei).

4. Launch the deployment script as follows:

    ```bash
    $ env STAKEUSD=1000 npm run deploy -- --network mainnet # STAKEUSD is STAKE/USD rate in USD cents
    ```

If the deployment is successful, you will see `addresses.mainnet.json` file in the root of the repo. The file will contain all addresses needed to work with this prototype (contract addresses; admin, staker, currencyRateChanger).

## Usage

To emulate the minting of EXIT tokens, call the `Reward.finishStakingEpoch` function. This function cannot be called by the `admin`, so please use another address for making the transaction. To ensure the supply of EXIT tokens is increased, use `exitToken.totalSupply` getter.

To rebalance SoftETH supply after ETH/USD rate changing, call `Reward.rebalance`. This function cannot be called by the `admin`, so please use another address for making the transaction.

To change STAKE/USD rate, call the `Reward.setSTAKEUSD` function by the `Currency Rate Changer` address.

To compare the current SoftETH supply with the expected supply, use `Reward.softETHCurrentSupply` and `Reward.softETHExpectedSupply` getters. They should return almost the same value after `rebalance` is called.

To know the current ETH/USD rate provided by the price oracle, use `Reward.ethUsdCurrent` getter.
