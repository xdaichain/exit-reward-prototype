pragma solidity 0.5.16;


interface ISoftETHToken {
    function burn(uint256 _amount) external;
    function mint(address _account, uint256 _amount) external returns(bool);
    function totalSupply() external view returns(uint256);
}
