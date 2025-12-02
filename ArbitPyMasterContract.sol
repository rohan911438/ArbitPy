// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title ArbitPyMaster - Advanced DeFi Arbitrage & Yield Optimization Contract
 * @dev A comprehensive smart contract for the ArbitPy playground featuring:
 *      - Multi-DEX arbitrage execution
 *      - Yield farming optimization  
 *      - Flash loan integration
 *      - Liquidity management
 *      - Fee distribution system
 *      - Emergency controls
 */
contract ArbitPyMaster is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // ======================== STRUCTS ========================
    
    struct ArbitrageParams {
        address tokenA;
        address tokenB;
        address dexA;
        address dexB;
        uint256 amountIn;
        uint256 minAmountOut;
        bytes routerCallDataA;
        bytes routerCallDataB;
    }

    struct UserPosition {
        uint256 totalDeposited;
        uint256 totalWithdrawn;
        uint256 pendingRewards;
        uint256 lastInteractionBlock;
        mapping(address => uint256) tokenBalances;
    }

    struct PoolInfo {
        address token;
        uint256 totalSupply;
        uint256 rewardRate;
        uint256 lastRewardBlock;
        uint256 accRewardPerShare;
        bool active;
    }

    // ======================== EVENTS ========================
    
    event ArbitrageExecuted(
        address indexed user,
        address tokenA,
        address tokenB,
        uint256 amountIn,
        uint256 profit,
        uint256 timestamp
    );

    event LiquidityAdded(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event LiquidityRemoved(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event RewardsClaimed(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

    event FlashLoanExecuted(
        address indexed user,
        address token,
        uint256 amount,
        uint256 fee
    );

    event StrategyExecuted(
        address indexed user,
        string strategyType,
        uint256 inputAmount,
        uint256 outputAmount
    );

    // ======================== STATE VARIABLES ========================
    
    mapping(address => UserPosition) public userPositions;
    mapping(uint256 => PoolInfo) public pools;
    mapping(address => bool) public authorizedRouters;
    mapping(address => uint256) public tokenPriceOracles;
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_FEE = 1000; // 10%
    uint256 public constant FLASH_LOAN_FEE = 9; // 0.09%
    
    uint256 public platformFee = 30; // 0.3%
    uint256 public totalPoolCount;
    uint256 public totalTVL;
    uint256 public totalVolume;
    uint256 public totalArbitrageProfit;
    
    address public feeRecipient;
    address public emergencyWithdrawer;
    
    bool public flashLoansEnabled = true;
    bool public arbitrageEnabled = true;
    
    // Supported DEX routers
    mapping(address => string) public dexNames;
    address[] public supportedDEXs;

    // ======================== MODIFIERS ========================
    
    modifier onlyAuthorizedRouter(address router) {
        require(authorizedRouters[router], "ArbitPy: Router not authorized");
        _;
    }

    modifier validPool(uint256 poolId) {
        require(poolId < totalPoolCount && pools[poolId].active, "ArbitPy: Invalid pool");
        _;
    }

    modifier flashLoansAllowed() {
        require(flashLoansEnabled, "ArbitPy: Flash loans disabled");
        _;
    }

    modifier arbitrageAllowed() {
        require(arbitrageEnabled, "ArbitPy: Arbitrage disabled");
        _;
    }

    // ======================== CONSTRUCTOR ========================
    
    constructor(
        address _feeRecipient,
        address _emergencyWithdrawer
    ) {
        require(_feeRecipient != address(0), "ArbitPy: Invalid fee recipient");
        require(_emergencyWithdrawer != address(0), "ArbitPy: Invalid emergency withdrawer");
        
        feeRecipient = _feeRecipient;
        emergencyWithdrawer = _emergencyWithdrawer;
        
        // Initialize first pool
        _createPool(address(0), 0, true); // ETH pool
    }

    // ======================== ARBITRAGE FUNCTIONS ========================
    
    /**
     * @dev Execute arbitrage between two DEXs
     * @param params Arbitrage parameters containing DEX addresses, tokens, amounts
     */
    function executeArbitrage(
        ArbitrageParams calldata params
    ) external payable nonReentrant whenNotPaused arbitrageAllowed {
        require(params.amountIn > 0, "ArbitPy: Invalid amount");
        require(params.tokenA != params.tokenB, "ArbitPy: Same tokens");
        require(authorizedRouters[params.dexA] && authorizedRouters[params.dexB], "ArbitPy: Unauthorized DEX");

        uint256 initialBalance;
        if (params.tokenA == address(0)) {
            require(msg.value == params.amountIn, "ArbitPy: Incorrect ETH amount");
            initialBalance = address(this).balance - msg.value;
        } else {
            IERC20(params.tokenA).safeTransferFrom(msg.sender, address(this), params.amountIn);
            initialBalance = IERC20(params.tokenA).balanceOf(address(this)) - params.amountIn;
        }

        // Execute trade on DEX A
        uint256 intermediateAmount = _executeDEXTrade(params.dexA, params.routerCallDataA);
        require(intermediateAmount > 0, "ArbitPy: DEX A trade failed");

        // Execute trade on DEX B
        uint256 finalAmount = _executeDEXTrade(params.dexB, params.routerCallDataB);
        require(finalAmount >= params.minAmountOut, "ArbitPy: Slippage exceeded");

        uint256 profit;
        if (params.tokenA == address(0)) {
            uint256 finalBalance = address(this).balance;
            profit = finalBalance > initialBalance ? finalBalance - initialBalance : 0;
        } else {
            uint256 finalBalance = IERC20(params.tokenA).balanceOf(address(this));
            profit = finalBalance > initialBalance ? finalBalance - initialBalance : 0;
        }

        // Charge platform fee
        uint256 fee = profit.mul(platformFee).div(10000);
        uint256 userProfit = profit.sub(fee);

        if (fee > 0) {
            if (params.tokenA == address(0)) {
                payable(feeRecipient).transfer(fee);
            } else {
                IERC20(params.tokenA).safeTransfer(feeRecipient, fee);
            }
        }

        // Transfer profit to user
        if (userProfit > 0) {
            if (params.tokenA == address(0)) {
                payable(msg.sender).transfer(userProfit);
            } else {
                IERC20(params.tokenA).safeTransfer(msg.sender, userProfit);
            }
        }

        // Update stats
        totalArbitrageProfit = totalArbitrageProfit.add(profit);
        totalVolume = totalVolume.add(params.amountIn);

        emit ArbitrageExecuted(
            msg.sender,
            params.tokenA,
            params.tokenB,
            params.amountIn,
            userProfit,
            block.timestamp
        );
    }

    // ======================== LIQUIDITY FUNCTIONS ========================
    
    /**
     * @dev Add liquidity to a specific pool
     * @param poolId The pool to add liquidity to
     * @param amount Amount of tokens to add
     */
    function addLiquidity(
        uint256 poolId,
        uint256 amount
    ) external payable nonReentrant whenNotPaused validPool(poolId) {
        require(amount > 0, "ArbitPy: Invalid amount");
        
        PoolInfo storage pool = pools[poolId];
        UserPosition storage user = userPositions[msg.sender];

        // Update rewards before changing user position
        _updateRewards(poolId, msg.sender);

        if (pool.token == address(0)) {
            require(msg.value == amount, "ArbitPy: Incorrect ETH amount");
        } else {
            IERC20(pool.token).safeTransferFrom(msg.sender, address(this), amount);
        }

        user.totalDeposited = user.totalDeposited.add(amount);
        user.tokenBalances[pool.token] = user.tokenBalances[pool.token].add(amount);
        user.lastInteractionBlock = block.number;

        pool.totalSupply = pool.totalSupply.add(amount);
        totalTVL = totalTVL.add(amount);

        emit LiquidityAdded(msg.sender, pool.token, amount, block.timestamp);
    }

    /**
     * @dev Remove liquidity from a specific pool
     * @param poolId The pool to remove liquidity from
     * @param amount Amount of tokens to remove
     */
    function removeLiquidity(
        uint256 poolId,
        uint256 amount
    ) external nonReentrant whenNotPaused validPool(poolId) {
        require(amount > 0, "ArbitPy: Invalid amount");
        
        PoolInfo storage pool = pools[poolId];
        UserPosition storage user = userPositions[msg.sender];
        
        require(user.tokenBalances[pool.token] >= amount, "ArbitPy: Insufficient balance");

        // Update rewards before changing user position
        _updateRewards(poolId, msg.sender);

        user.totalWithdrawn = user.totalWithdrawn.add(amount);
        user.tokenBalances[pool.token] = user.tokenBalances[pool.token].sub(amount);
        user.lastInteractionBlock = block.number;

        pool.totalSupply = pool.totalSupply.sub(amount);
        totalTVL = totalTVL.sub(amount);

        // Transfer tokens back to user
        if (pool.token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(pool.token).safeTransfer(msg.sender, amount);
        }

        emit LiquidityRemoved(msg.sender, pool.token, amount, block.timestamp);
    }

    // ======================== YIELD FARMING FUNCTIONS ========================
    
    /**
     * @dev Claim pending rewards for a user
     */
    function claimRewards() external nonReentrant whenNotPaused {
        UserPosition storage user = userPositions[msg.sender];
        
        // Update all pool rewards for user
        for (uint256 i = 0; i < totalPoolCount; i++) {
            if (pools[i].active) {
                _updateRewards(i, msg.sender);
            }
        }

        uint256 rewards = user.pendingRewards;
        require(rewards > 0, "ArbitPy: No rewards available");

        user.pendingRewards = 0;
        
        // Mint or transfer reward tokens (assuming ETH rewards for simplicity)
        payable(msg.sender).transfer(rewards);

        emit RewardsClaimed(msg.sender, rewards, block.timestamp);
    }

    // ======================== FLASH LOAN FUNCTIONS ========================
    
    /**
     * @dev Execute flash loan
     * @param token Token to borrow
     * @param amount Amount to borrow
     * @param data Callback data for flash loan execution
     */
    function flashLoan(
        address token,
        uint256 amount,
        bytes calldata data
    ) external nonReentrant whenNotPaused flashLoansAllowed {
        require(amount > 0, "ArbitPy: Invalid amount");
        
        uint256 balanceBefore;
        if (token == address(0)) {
            balanceBefore = address(this).balance;
            require(balanceBefore >= amount, "ArbitPy: Insufficient ETH liquidity");
        } else {
            balanceBefore = IERC20(token).balanceOf(address(this));
            require(balanceBefore >= amount, "ArbitPy: Insufficient token liquidity");
        }

        uint256 fee = amount.mul(FLASH_LOAN_FEE).div(10000);

        // Transfer tokens to borrower
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }

        // Execute callback
        IFlashLoanReceiver(msg.sender).executeOperation(token, amount, fee, data);

        // Verify repayment
        uint256 balanceAfter;
        if (token == address(0)) {
            balanceAfter = address(this).balance;
        } else {
            balanceAfter = IERC20(token).balanceOf(address(this));
        }

        require(
            balanceAfter >= balanceBefore.add(fee),
            "ArbitPy: Flash loan not repaid"
        );

        emit FlashLoanExecuted(msg.sender, token, amount, fee);
    }

    // ======================== STRATEGY FUNCTIONS ========================
    
    /**
     * @dev Execute yield optimization strategy
     * @param strategyType Type of strategy to execute
     * @param inputToken Input token address
     * @param inputAmount Amount of input tokens
     * @param minOutputAmount Minimum output amount expected
     */
    function executeStrategy(
        string memory strategyType,
        address inputToken,
        uint256 inputAmount,
        uint256 minOutputAmount
    ) external payable nonReentrant whenNotPaused {
        require(inputAmount > 0, "ArbitPy: Invalid input amount");

        uint256 outputAmount;
        
        if (keccak256(bytes(strategyType)) == keccak256(bytes("COMPOUND"))) {
            outputAmount = _executeCompoundStrategy(inputToken, inputAmount);
        } else if (keccak256(bytes(strategyType)) == keccak256(bytes("YIELD_FARM"))) {
            outputAmount = _executeYieldFarmStrategy(inputToken, inputAmount);
        } else if (keccak256(bytes(strategyType)) == keccak256(bytes("LIQUIDITY_MINING"))) {
            outputAmount = _executeLiquidityMiningStrategy(inputToken, inputAmount);
        } else {
            revert("ArbitPy: Unknown strategy");
        }

        require(outputAmount >= minOutputAmount, "ArbitPy: Strategy slippage exceeded");

        emit StrategyExecuted(msg.sender, strategyType, inputAmount, outputAmount);
    }

    // ======================== VIEW FUNCTIONS ========================
    
    /**
     * @dev Get user position information
     */
    function getUserPosition(address user) external view returns (
        uint256 totalDeposited,
        uint256 totalWithdrawn,
        uint256 pendingRewards,
        uint256 lastInteractionBlock
    ) {
        UserPosition storage position = userPositions[user];
        return (
            position.totalDeposited,
            position.totalWithdrawn,
            position.pendingRewards,
            position.lastInteractionBlock
        );
    }

    /**
     * @dev Get user token balance in a specific pool
     */
    function getUserTokenBalance(address user, address token) external view returns (uint256) {
        return userPositions[user].tokenBalances[token];
    }

    /**
     * @dev Get pool information
     */
    function getPoolInfo(uint256 poolId) external view returns (
        address token,
        uint256 totalSupply,
        uint256 rewardRate,
        uint256 lastRewardBlock,
        uint256 accRewardPerShare,
        bool active
    ) {
        PoolInfo storage pool = pools[poolId];
        return (
            pool.token,
            pool.totalSupply,
            pool.rewardRate,
            pool.lastRewardBlock,
            pool.accRewardPerShare,
            pool.active
        );
    }

    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 _totalTVL,
        uint256 _totalVolume,
        uint256 _totalArbitrageProfit,
        uint256 _totalPoolCount
    ) {
        return (totalTVL, totalVolume, totalArbitrageProfit, totalPoolCount);
    }

    // ======================== ADMIN FUNCTIONS ========================
    
    /**
     * @dev Create a new pool
     */
    function createPool(
        address token,
        uint256 rewardRate
    ) external onlyOwner {
        _createPool(token, rewardRate, true);
    }

    /**
     * @dev Add authorized router
     */
    function addAuthorizedRouter(
        address router,
        string memory name
    ) external onlyOwner {
        require(router != address(0), "ArbitPy: Invalid router");
        authorizedRouters[router] = true;
        dexNames[router] = name;
        supportedDEXs.push(router);
    }

    /**
     * @dev Update platform fee
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "ArbitPy: Fee too high");
        platformFee = newFee;
    }

    /**
     * @dev Toggle flash loans
     */
    function toggleFlashLoans() external onlyOwner {
        flashLoansEnabled = !flashLoansEnabled;
    }

    /**
     * @dev Toggle arbitrage
     */
    function toggleArbitrage() external onlyOwner {
        arbitrageEnabled = !arbitrageEnabled;
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Emergency unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal by authorized withdrawer
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external {
        require(msg.sender == emergencyWithdrawer, "ArbitPy: Unauthorized");
        
        if (token == address(0)) {
            payable(emergencyWithdrawer).transfer(amount);
        } else {
            IERC20(token).safeTransfer(emergencyWithdrawer, amount);
        }
    }

    // ======================== INTERNAL FUNCTIONS ========================
    
    function _createPool(
        address token,
        uint256 rewardRate,
        bool active
    ) internal {
        pools[totalPoolCount] = PoolInfo({
            token: token,
            totalSupply: 0,
            rewardRate: rewardRate,
            lastRewardBlock: block.number,
            accRewardPerShare: 0,
            active: active
        });
        totalPoolCount++;
    }

    function _executeDEXTrade(
        address router,
        bytes memory callData
    ) internal returns (uint256) {
        (bool success, bytes memory result) = router.call(callData);
        require(success, "ArbitPy: DEX trade failed");
        
        // Decode return value (assuming it returns amount)
        return abi.decode(result, (uint256));
    }

    function _updateRewards(uint256 poolId, address user) internal {
        PoolInfo storage pool = pools[poolId];
        UserPosition storage userPos = userPositions[user];

        if (pool.totalSupply > 0) {
            uint256 blocksPassed = block.number.sub(pool.lastRewardBlock);
            uint256 reward = blocksPassed.mul(pool.rewardRate);
            pool.accRewardPerShare = pool.accRewardPerShare.add(
                reward.mul(PRECISION).div(pool.totalSupply)
            );
            pool.lastRewardBlock = block.number;
        }

        uint256 userBalance = userPos.tokenBalances[pool.token];
        if (userBalance > 0) {
            uint256 pending = userBalance.mul(pool.accRewardPerShare).div(PRECISION);
            userPos.pendingRewards = userPos.pendingRewards.add(pending);
        }
    }

    function _executeCompoundStrategy(
        address inputToken,
        uint256 inputAmount
    ) internal returns (uint256) {
        // Implementation for compound strategy
        // This would integrate with compound protocol
        return inputAmount.mul(105).div(100); // 5% yield simulation
    }

    function _executeYieldFarmStrategy(
        address inputToken,
        uint256 inputAmount
    ) internal returns (uint256) {
        // Implementation for yield farming strategy
        return inputAmount.mul(108).div(100); // 8% yield simulation
    }

    function _executeLiquidityMiningStrategy(
        address inputToken,
        uint256 inputAmount
    ) internal returns (uint256) {
        // Implementation for liquidity mining strategy
        return inputAmount.mul(112).div(100); // 12% yield simulation
    }

    // ======================== RECEIVE FUNCTION ========================
    
    receive() external payable {
        // Allow contract to receive ETH
    }
}

// ======================== INTERFACES ========================

interface IFlashLoanReceiver {
    function executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external;
}