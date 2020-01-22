pragma solidity 0.5.16;

import "./interfaces/IExitToken.sol";
import "./interfaces/ISoftETH.sol";
import "./interfaces/IPriceOracle.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";


contract Reward is Initializable {

    // =============================================== Storage ========================================================

    // WARNING: since this contract is upgradeable, do not remove
    // existing storage variables and do not change their types!

    /// @dev The serial number of the latest finished staking epoch.
    uint256 public lastStakingEpochFinished;

    /// @dev The address of staker. Used by `finishStakingEpoch` function
    /// to emulate staking. EXIT tokens are minted to this address.
    address public staker;

    /// @dev The address that has the rights to change STAKE/USD rate.
    address public currencyRateChanger;

    /// @dev The address of EXIT token contract.
    IExitToken public exitToken;

    /// @dev The address of softETH token contract.
    ISoftETH public softETHToken;

    /// @dev The latest known ETH/USD rate (in USD cents) set by `rebalance` function.
    /// Has 2 decimals (e.g., 160.35 USD presented as 16035).
    uint256 public ethUsd;

    /// @dev The STAKE/USD rate (in USD cents) set by `setSTAKEUSD` function.
    /// Has 2 decimals (e.g., 20.45 USD presented as 2045).
    uint256 public stakeUsd;

    // ============================================== Constants =======================================================

    /// @dev How many EXIT tokens must be minted in relation to
    /// the USD worth of STAKE tokens staked into all pools.
    uint256 public constant EXIT_MINT_RATE = 10; // percents

    /// @dev How many times the USD worth of softETH tokens must
    /// exceed the total supply of EXIT tokens.
    uint256 public constant COLLATERAL_MULTIPLIER = 2;

    // ================================================ Events ========================================================

    /// @dev Emitted by the `rebalance` function.
    /// @param newAmount The new `totalSupply` of softETH tokens.
    /// @param caller The address called the function.
    event Rebalanced(uint256 newAmount, address indexed caller);

    /// @dev Emitted by the `finishStakingEpoch` function.
    /// @param stakingEpoch The number of finished staking epoch.
    /// @param totalStakeAmount The total amount of STAKE tokens staked before the epoch finished.
    /// @param exitMintAmount How many EXIT tokens were minted.
    /// @param caller The address called the function.
    event StakingEpochFinished(
        uint256 indexed stakingEpoch,
        uint256 totalStakeAmount,
        uint256 exitMintAmount,
        address indexed caller
    );

    // ============================================== Modifiers =======================================================

    /// @dev Modifier to check whether the `msg.sender` is the `currencyRateChanger`.
    modifier ifCurrencyRateChanger() {
        require(msg.sender == currencyRateChanger);
        _;
    }

    /// @dev Modifier to check whether the `msg.sender` is the admin (owner).
    modifier ifOwner() {
        require(msg.sender == _admin());
        _;
    }

    // =============================================== Setters ========================================================

    /// @dev Emulates finishing of staking epoch, mints EXIT tokens for the `staker` address.
    /// Can by called by anyone. The amount of EXIT tokens to be minted is calculated
    /// based on the `_totalStakeAmount` parameter, EXIT_MINT_RATE, and the current
    /// STAKE/USD rate defined in `stakeUsd`.
    /// @param _totalStakeAmount The total amount of STAKE tokens staked at the moment of
    /// the end of staking epoch. The amount must have 18 decimals.
    function finishStakingEpoch(uint256 _totalStakeAmount) public {
        require(exitToken != IExitToken(0));
        require(staker != address(0));
        require(stakeUsd != 0);

        uint256 usdAmount = _totalStakeAmount * stakeUsd / 100;
        uint256 mintAmount = usdAmount * EXIT_MINT_RATE / 100;
        exitToken.mint(staker, mintAmount);
        rebalance();

        lastStakingEpochFinished++;

        emit StakingEpochFinished(lastStakingEpochFinished, _totalStakeAmount, mintAmount, msg.sender);
    }

    /// @dev Initializes the contract. Used instead of constructor since this contract is upgradeable.
    /// Can only be called by the owner.
    /// @param _staker The address of staker. EXIT tokens will be minted to this address.
    /// @param _currencyRateChanger The address that has the rights to change STAKE/USD rate.
    /// @param _exitToken The address of EXIT token contract.
    /// @param _softETHToken The address of softETH token contract.
    function initialize(
        address _staker,
        address _currencyRateChanger,
        IExitToken _exitToken,
        ISoftETH _softETHToken
    ) public initializer ifOwner {
        require(_staker != address(0));
        require(_currencyRateChanger != address(0));
        require(_exitToken != IExitToken(0));
        require(_softETHToken != ISoftETH(0));
        staker = _staker;
        currencyRateChanger = _currencyRateChanger;
        exitToken = _exitToken;
        softETHToken = _softETHToken;
    }

    /// @dev Rebalances the totalSupply of softETH so that it would exceed
    /// EXIT token supply COLLATERAL_MULTIPLIER times in USD worth.
    /// Can be called by anyone.
    function rebalance() public {
        require(exitToken != IExitToken(0));
        require(softETHToken != ISoftETH(0));

        uint256 ethInUSD = usdEthCurrent(); // how many ETHs in 1 USD at the moment
        require(ethInUSD != 0);
        
        // Calculate the current and new softETH amounts
        uint256 currentAmount = softETHToken.totalSupply();
        uint256 newAmount = exitToken.totalSupply() * COLLATERAL_MULTIPLIER * ethInUSD;

        if (newAmount > currentAmount) {
            // We need to have more softETH tokens, so mint the lack tokens
            softETHToken.mint(address(this), newAmount - currentAmount);
        } else if (newAmount < currentAmount) {
            // We need to have less softETH tokens, so burn the excess tokens
            softETHToken.burn(currentAmount - newAmount);
        }

        ethUsd = 100 ether / ethInUSD;

        emit Rebalanced(newAmount, msg.sender);
    }

    /// @dev Sets the current STAKE/USD rate in USD cents.
    /// Can only be called by the `currencyRateChanger`.
    /// @param _cents The rate in USD cents. Must have 2 decimals,
    /// e.g., 20.45 USD presented as 2045.
    function setSTAKEUSD(uint256 _cents) public ifCurrencyRateChanger {
        require(_cents != 0);
        stakeUsd = _cents;
    }

    // =============================================== Getters ========================================================

    /// @dev Returns the current amount of USDTs in 1 ETH, i.e. ETH/USDT rate (in USD cents).
    /// The returned amount has 2 decimals (e.g., 160.35 USD presented as 16035).
    function ethUsdCurrent() public view returns(uint256) {
        uint256 ethers = usdEthCurrent();
        if (ethers == 0) return 0;
        return 100 ether / ethers;
    }

    /// @dev Returns the current amount of ETHs in 1 USDT, i.e. USDT/ETH rate.
    /// The returned amount has 18 decimals.
    function usdEthCurrent() public view returns(uint256) {
        (uint256 returnAmount,) = IPriceOracle(PRICE_ORACLE).getExpectedReturn(
            0xdAC17F958D2ee523a2206206994597C13D831ec7, // fromToken (USDT)
            0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, // toToken (ETH)
            1000000, // amount (1.00 USDT)
            1, // parts
            0  // disableFlags
        );
        return returnAmount;
    }

    // ============================================== Internal ========================================================

    /// @dev Storage slot with the admin (owner) of the contract (needed for upgradability).
    /// This is the keccak-256 hash of "eip1967.proxy.admin" subtracted by 1.
    bytes32 internal constant ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    /// @dev The address of the contract in Ethereum Mainnet which provides the current USD/ETH rate.
    address internal constant PRICE_ORACLE = 0xAd13fE330B0aE312bC51d2E5B9Ca2ae3973957C7;

    /// @dev Returns the admin slot (needed for upgradability).
    function _admin() internal view returns(address adm) {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            adm := sload(slot)
        }
    }

}
