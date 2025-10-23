// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title EscrowHub - Secure escrow contract for DeFi Bank
/// @notice Manages escrow transactions with automatic expiry and dispute resolution
contract EscrowHub is ReentrancyGuard, Ownable {

    enum EscrowState {
        AWAITING_DELIVERY,
        COMPLETED,
        CLAIMED_ON_EXPIRE,
        REFUNDED
    }

    struct Escrow {
        uint256 id;
        string title;
        string description;
        address payable buyer;
        address payable seller;
        uint256 amount;
        uint256 fee;
        uint256 createdAt;
        uint256 expireAt;
        uint256 clearAt;
        EscrowState state;
    }

    uint256 private _escrowIds;
    mapping(uint256 => Escrow) private idToEscrow;
    mapping(address => uint256) private addressToEscrowCount;
    mapping(address => mapping(uint256 => uint256)) private addressToEscrowIndexes;
    
    uint256 private constant _minimumEscrow = 1000000000000000; // 0.001 HBAR in wei (1e15)
    uint256 private constant _fee = 2; // Fee in percent (2%)

    event EscrowCreated(
        uint256 indexed escrowId,
        string title,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 fee,
        uint256 expireAt,
        EscrowState state
    );

    event EscrowUpdated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        EscrowState state
    );

    event DebugValues(
        uint256 msgValue,
        uint256 minimumEscrow,
        bool comparison
    );

    constructor() Ownable(msg.sender) {}

    modifier onlyBuyer(uint256 escrowId) {
        require(
            idToEscrow[escrowId].buyer == msg.sender,
            "Only buyer can access"
        );
        _;
    }

    modifier onlySeller(uint256 escrowId) {
        require(
            idToEscrow[escrowId].seller == msg.sender,
            "Only seller can access"
        );
        _;
    }

    modifier notBuyer(uint256 escrowId) {
        require(
            idToEscrow[escrowId].seller == msg.sender || owner() == msg.sender,
            "Only seller or owner can perform this action"
        );
        _;
    }

    /// @notice Create a new escrow contract
    /// @param _seller Address of the seller
    /// @param _title Title of the escrow contract
    /// @param _description Description of the escrow contract
    /// @param _expireAt Timestamp when the escrow expires
    function newEscrow(
        address _seller,
        string memory _title,
        string memory _description,
        uint256 _expireAt
    ) public payable nonReentrant {
        require(_seller != address(0), "Invalid seller address");
        require(_seller != msg.sender, "Buyer and seller cannot be the same");
        require(msg.value > 0, "Amount must be greater than zero");
        require(_expireAt > block.timestamp, "Expiry must be in the future");
        
        _escrowIds++;
        uint256 curId = _escrowIds;
        
        uint256 fee = (msg.value * _fee) / 100;
        uint256 amount = msg.value - fee;
        
        idToEscrow[curId] = Escrow(
            curId,
            _title,
            _description,
            payable(msg.sender),
            payable(_seller),
            amount,
            fee,
            block.timestamp,
            _expireAt,
            0,
            EscrowState.AWAITING_DELIVERY
        );

        // Update mappings for both buyer and seller
        addressToEscrowCount[msg.sender] = addressToEscrowCount[msg.sender] + 1;
        addressToEscrowIndexes[msg.sender][addressToEscrowCount[msg.sender]] = curId;
        
        addressToEscrowCount[_seller] = addressToEscrowCount[_seller] + 1;
        addressToEscrowIndexes[_seller][addressToEscrowCount[_seller]] = curId;

        emit EscrowCreated(
            curId,
            _title,
            msg.sender,
            _seller,
            amount,
            fee,
            _expireAt,
            EscrowState.AWAITING_DELIVERY
        );
    }

    /// @notice Buyer confirms delivery and releases funds to seller
    /// @param _escrowId ID of the escrow to complete
    function deliver(uint256 _escrowId) public onlyBuyer(_escrowId) nonReentrant {
        require(
            idToEscrow[_escrowId].state == EscrowState.AWAITING_DELIVERY,
            "Escrow already processed"
        );

        idToEscrow[_escrowId].seller.transfer(idToEscrow[_escrowId].amount);
        payable(owner()).transfer(idToEscrow[_escrowId].fee);
        idToEscrow[_escrowId].clearAt = block.timestamp;
        idToEscrow[_escrowId].state = EscrowState.COMPLETED;

        emit EscrowUpdated(
            _escrowId,
            idToEscrow[_escrowId].buyer,
            idToEscrow[_escrowId].seller,
            idToEscrow[_escrowId].amount,
            EscrowState.COMPLETED
        );
    }

    /// @notice Seller claims funds after expiry
    /// @param _escrowId ID of the escrow to claim
    function claimAfterExpire(uint256 _escrowId) public onlySeller(_escrowId) nonReentrant {
        require(
            idToEscrow[_escrowId].expireAt <= block.timestamp,
            "Escrow not yet expired"
        );
        require(
            idToEscrow[_escrowId].state == EscrowState.AWAITING_DELIVERY,
            "Escrow already processed"
        );

        idToEscrow[_escrowId].seller.transfer(idToEscrow[_escrowId].amount);
        payable(owner()).transfer(idToEscrow[_escrowId].fee);
        idToEscrow[_escrowId].clearAt = block.timestamp;
        idToEscrow[_escrowId].state = EscrowState.CLAIMED_ON_EXPIRE;

        emit EscrowUpdated(
            _escrowId,
            idToEscrow[_escrowId].buyer,
            idToEscrow[_escrowId].seller,
            idToEscrow[_escrowId].amount,
            EscrowState.CLAIMED_ON_EXPIRE
        );
    }

    /// @notice Refund the escrow to buyer (seller or owner only)
    /// @param _escrowId ID of the escrow to refund
    function refund(uint256 _escrowId) public notBuyer(_escrowId) nonReentrant {
        require(
            idToEscrow[_escrowId].state == EscrowState.AWAITING_DELIVERY,
            "Escrow already processed"
        );

        idToEscrow[_escrowId].buyer.transfer(
            idToEscrow[_escrowId].amount + idToEscrow[_escrowId].fee
        );
        idToEscrow[_escrowId].clearAt = block.timestamp;
        idToEscrow[_escrowId].state = EscrowState.REFUNDED;

        emit EscrowUpdated(
            _escrowId,
            idToEscrow[_escrowId].buyer,
            idToEscrow[_escrowId].seller,
            idToEscrow[_escrowId].amount,
            EscrowState.REFUNDED
        );
    }

    /// @notice Get all escrows (public view for transparency)
    /// @return Array of all escrows
    function fetchAllEscrows() public view returns (Escrow[] memory) {
        uint256 totalItemCount = _escrowIds;
        Escrow[] memory items = new Escrow[](totalItemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            items[i] = idToEscrow[i + 1];
        }
        return items;
    }

    /// @notice Get escrows for the current user
    /// @return Array of escrows for the caller
    function fetchMyEscrows() public view returns (Escrow[] memory) {
        if (owner() == msg.sender) {
            // Owner can see all escrows
            return fetchAllEscrows();
        } else {
            // Regular users see only their escrows
            Escrow[] memory items = new Escrow[](addressToEscrowCount[msg.sender]);
            for (uint256 i = 0; i < addressToEscrowCount[msg.sender]; i++) {
                items[i] = idToEscrow[addressToEscrowIndexes[msg.sender][i + 1]];
            }
            return items;
        }
    }

    /// @notice Get a specific escrow by ID
    /// @param escrowId ID of the escrow to fetch
    /// @return The escrow struct
    function fetchEscrow(uint256 escrowId) public view returns (Escrow memory) {
        return idToEscrow[escrowId];
    }

    /// @notice Get the minimum escrow amount
    /// @return Minimum escrow amount in wei
    function getMinimumEscrow() public pure returns (uint256) {
        return _minimumEscrow;
    }

    /// @notice Get the fee percentage
    /// @return Fee percentage
    function getFeePercentage() public pure returns (uint256) {
        return _fee;
    }

    /// @notice Get total number of escrows
    /// @return Total escrow count
    function getTotalEscrows() public view returns (uint256) {
        return _escrowIds;
    }
}
