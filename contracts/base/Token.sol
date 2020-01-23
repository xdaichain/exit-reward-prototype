pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/utils/Address.sol";


/// @dev An abstract contract inherited by ExitToken and SoftETHToken.
contract Token is ERC20Detailed, ERC20Mintable {
    using Address for address;

    /// @dev Creates a token.
    /// @param _minter The address of the `Reward` contract.
    /// Since the `Reward` contract is upgradable, the address is supposed to be constant
    /// and won't change in the future.
    constructor(address _minter) internal {
        require(_minter.isContract());
        renounceMinter(); // deprive `msg.sender` of minter role
        _addMinter(_minter);
    }
}
