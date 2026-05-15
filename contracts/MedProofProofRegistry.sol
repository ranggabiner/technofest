// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MedProofProofRegistry {
  error DuplicateRecordHash(bytes32 recordHash);
  error DuplicateConsentHash(bytes32 consentHash);
  error DuplicateAuditEventHash(bytes32 auditEventHash);
  error EmptyProofHash();

  mapping(bytes32 => bool) public registeredRecordHashes;
  mapping(bytes32 => bool) public registeredConsentHashes;
  mapping(bytes32 => bool) public registeredAuditEventHashes;

  event HealthRecordRegistered(
    bytes32 indexed recordHash,
    bytes32 indexed patientHash,
    bytes32 indexed issuerHash,
    uint256 version
  );

  event ConsentRecorded(
    bytes32 indexed consentHash,
    bytes32 indexed patientHash,
    bytes32 indexed granteeHash,
    uint256 expiresAt,
    bool isRevoked
  );

  event AuditEventRecorded(
    bytes32 indexed auditEventHash,
    bytes32 indexed actorHash,
    bytes32 indexed targetHash,
    bytes32 actionHash
  );

  function registerHealthRecord(
    bytes32 recordHash,
    bytes32 patientHash,
    bytes32 issuerHash,
    uint256 version
  ) external {
    if (recordHash == bytes32(0)) revert EmptyProofHash();
    if (registeredRecordHashes[recordHash]) revert DuplicateRecordHash(recordHash);

    registeredRecordHashes[recordHash] = true;
    emit HealthRecordRegistered(recordHash, patientHash, issuerHash, version);
  }

  function recordConsent(
    bytes32 consentHash,
    bytes32 patientHash,
    bytes32 granteeHash,
    uint256 expiresAt,
    bool isRevoked
  ) external {
    if (consentHash == bytes32(0)) revert EmptyProofHash();
    if (registeredConsentHashes[consentHash]) revert DuplicateConsentHash(consentHash);

    registeredConsentHashes[consentHash] = true;
    emit ConsentRecorded(consentHash, patientHash, granteeHash, expiresAt, isRevoked);
  }

  function recordAuditEvent(
    bytes32 auditEventHash,
    bytes32 actorHash,
    bytes32 targetHash,
    bytes32 actionHash
  ) external {
    if (auditEventHash == bytes32(0)) revert EmptyProofHash();
    if (registeredAuditEventHashes[auditEventHash]) {
      revert DuplicateAuditEventHash(auditEventHash);
    }

    registeredAuditEventHashes[auditEventHash] = true;
    emit AuditEventRecorded(auditEventHash, actorHash, targetHash, actionHash);
  }
}
