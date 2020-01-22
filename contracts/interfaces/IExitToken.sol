pragma solidity 0.5.16;


interface IExitToken {
    function mint(address _account, uint256 _amount) external returns(bool);
    function totalSupply() external view returns(uint256);
}
