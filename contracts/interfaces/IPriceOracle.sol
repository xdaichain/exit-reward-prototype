pragma solidity 0.5.16;

interface IPriceOracle {
    function getExpectedReturn(
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 parts,
        uint256 disableFlags // 1 - Uniswap, 2 - Kyber, 4 - Bancor, 8 - Oasis, 16 - Compound
    ) external view returns(
        uint256 returnAmount,
        uint[4] memory distribution // [Uniswap, Kyber, Bancor, Oasis]
    );
}
