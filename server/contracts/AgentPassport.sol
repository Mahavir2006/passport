// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentPassport {
    address public authority;

    struct Agent {
        string id;
        string name;
        string creator;
        string purpose;
        string requestedPermissions; // Comma-separated or JSON
        string grantedPermissions;   // Comma-separated or JSON
        string riskLevel;
        uint8 trustScore;
        uint256 spendingLimit;
        string verificationStatus;
        string createdAt;
        bool exists;
    }

    struct Visa {
        string id;
        string agentId;
        string website;
        string status;
        string reason;
        string issuedAt;
    }

    struct Stamp {
        string id;
        string agentId;
        string website;
        string action;
        string timestamp;
    }

    struct BlacklistEntry {
        string id;
        string agentName;
        string creator;
        string reason;
        string addedAt;
    }

    mapping(string => Agent) private agents;
    string[] private agentIds;

    mapping(string => Visa[]) private visas;
    mapping(string => Stamp[]) private stamps;

    BlacklistEntry[] private blacklist;

    event AgentRegistered(string id, string name, string creator, uint8 trustScore);
    event TrustScoreChanged(string id, uint8 oldScore, uint8 newScore, string reason, uint256 timestamp);
    event VerificationStatusChanged(string id, string oldStatus, string newStatus);
    event VisaIssued(string agentId, string website, string status);
    event StampAdded(string agentId, string website, string action);
    event BlacklistAdded(string agentName, string creator, string reason);

    modifier onlyAuthority() {
        require(msg.sender == authority, "Only authority can perform this action");
        _;
    }

    constructor() {
        authority = msg.sender;
    }

    function registerAgent(Agent memory _agent) public onlyAuthority {
        require(!agents[_agent.id].exists, "Agent already exists");
        agents[_agent.id] = _agent;
        agents[_agent.id].exists = true;
        agentIds.push(_agent.id);
        emit AgentRegistered(_agent.id, _agent.name, _agent.creator, _agent.trustScore);
    }

    function updateTrustScore(string memory _id, uint8 _newScore, string memory _reason) public onlyAuthority {
        require(agents[_id].exists, "Agent does not exist");
        uint8 oldScore = agents[_id].trustScore;
        agents[_id].trustScore = _newScore;
        emit TrustScoreChanged(_id, oldScore, _newScore, _reason, block.timestamp);
    }

    function updateVerificationStatus(string memory _id, string memory _status) public onlyAuthority {
        require(agents[_id].exists, "Agent does not exist");
        string memory oldStatus = agents[_id].verificationStatus;
        agents[_id].verificationStatus = _status;
        emit VerificationStatusChanged(_id, oldStatus, _status);
    }

    function addVisa(Visa memory _visa) public onlyAuthority {
        visas[_visa.agentId].push(_visa);
        emit VisaIssued(_visa.agentId, _visa.website, _visa.status);
    }

    function addStamp(Stamp memory _stamp) public onlyAuthority {
        stamps[_stamp.agentId].push(_stamp);
        emit StampAdded(_stamp.agentId, _stamp.website, _stamp.action);
    }

    function addToBlacklist(BlacklistEntry memory _entry) public onlyAuthority {
        blacklist.push(_entry);
        emit BlacklistAdded(_entry.agentName, _entry.creator, _entry.reason);
    }

    // View Functions for Server Read Operations
    function getAgent(string memory _id) public view returns (Agent memory) {
        require(agents[_id].exists, "Agent does not exist");
        return agents[_id];
    }

    function getAllAgentIds() public view returns (string[] memory) {
        return agentIds;
    }

    function getVisas(string memory _agentId) public view returns (Visa[] memory) {
        return visas[_agentId];
    }

    function getStamps(string memory _agentId) public view returns (Stamp[] memory) {
        return stamps[_agentId];
    }

    function getBlacklist() public view returns (BlacklistEntry[] memory) {
        return blacklist;
    }
}
