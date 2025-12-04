import React from "react";
import ErrorBoundary from "../../../common/erroBoundryComponent";
import AddRuleCreator from "../addRuleCreator";

const NewRuleModal = ({ showRuleModal, setShowRuleModal, getRulesData, operator }) => {
    return (
        <>
            {showRuleModal && (
                <ErrorBoundary>
                    <AddRuleCreator
                        open={showRuleModal}
                        setShowRuleModal={setShowRuleModal}
                        showRuleModal={showRuleModal}
                        getRulesData={getRulesData}
                        operator={operator}
                        onClose={() => setShowRuleModal(false)}
                    />
                </ErrorBoundary>
            )}
        </>
    );
};

export default NewRuleModal;
