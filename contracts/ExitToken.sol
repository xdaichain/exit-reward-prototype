pragma solidity 0.5.16;

import "./base/Token.sol";
import "./interfaces/IExitToken.sol";


contract ExitToken is IExitToken, Token {
    constructor(address _minter) ERC20Detailed("EXIT", "EXIT", 18) Token(_minter) public {}
}
