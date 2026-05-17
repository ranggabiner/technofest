// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {MedProofProofRegistry} from "./MedProofProofRegistry.sol";

contract MedProofProofRegistryTest {
  MedProofProofRegistry registry;

  function setUp() public {
    registry = new MedProofProofRegistry();
  }

  function test_RegisterHealthRecordRejectsDuplicate() public {
    bytes32 recordHash = keccak256("record");
    bytes32 patientHash = keccak256("patient");
    bytes32 issuerHash = keccak256("doctor");

    registry.registerHealthRecord(recordHash, patientHash, issuerHash, 1);
    require(registry.registeredRecordHashes(recordHash), "record hash should be registered");

    try registry.registerHealthRecord(recordHash, patientHash, issuerHash, 1) {
      revert("duplicate record hash should revert");
    } catch {}
  }

  function test_RecordConsentRejectsDuplicate() public {
    bytes32 consentHash = keccak256("consent");
    bytes32 patientHash = keccak256("patient");
    bytes32 granteeHash = keccak256("doctor");

    registry.recordConsent(consentHash, patientHash, granteeHash, 1_780_000_000, false);
    require(registry.registeredConsentHashes(consentHash), "consent hash should be registered");

    try registry.recordConsent(consentHash, patientHash, granteeHash, 1_780_000_000, false) {
      revert("duplicate consent hash should revert");
    } catch {}
  }

  function test_RecordAuditEventRejectsDuplicate() public {
    bytes32 auditEventHash = keccak256("audit");
    bytes32 actorHash = keccak256("actor");
    bytes32 targetHash = keccak256("target");
    bytes32 actionHash = keccak256("action");

    registry.recordAuditEvent(auditEventHash, actorHash, targetHash, actionHash);
    require(registry.registeredAuditEventHashes(auditEventHash), "audit hash should be registered");

    try registry.recordAuditEvent(auditEventHash, actorHash, targetHash, actionHash) {
      revert("duplicate audit hash should revert");
    } catch {}
  }
}
