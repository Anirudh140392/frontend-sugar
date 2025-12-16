import React from "react";
import { Modal } from "react-bootstrap";
import ErrorBoundary from "../../../common/erroBoundryComponent";
import EditRuleCreator from "../EditRuleCreator";

const EditRuleModal = (props) => {
  const { 
    showEditRuleModal,
    setShowEditRuleModal, 
    editRuleData, 
    getRulesData,
    operator 
  } = props;

  return (
    <EditRuleCreator
      open={showEditRuleModal}
      editRuleData={editRuleData}
      onSave={() => {
        getRulesData(true); // Force refresh after edit
        setShowEditRuleModal(false);
      }}
      onClose={() => setShowEditRuleModal(false)}
      setShowRuleModal={setShowEditRuleModal}
    />
  );
};

export default EditRuleModal;
