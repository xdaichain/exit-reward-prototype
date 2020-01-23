pragma solidity 0.5.16;

import "./base/Token.sol";
import "./interfaces/ISoftETHToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";


contract SoftETHToken is ISoftETHToken, ERC20Burnable, Token {
    constructor(address _minter) ERC20Detailed("SoftETH", "SOFTETH", 18) Token(_minter) public {}
}
