pragma solidity 0.5.16;

import "@openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol";


/// @dev The proxy contract for the Reward contract implementation.
contract RewardProxy is AdminUpgradeabilityProxy {
    /// @dev Contract constructor.
    /// @param _logic The address of the initial Reward contract implementation.
    constructor(address _logic) AdminUpgradeabilityProxy(_logic, msg.sender, new bytes(0)) public {}
}
